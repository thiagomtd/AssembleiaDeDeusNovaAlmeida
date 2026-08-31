import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarSecretaria, isAdmin, GRUPOS_ADMINISTRATIVOS, type Grupo } from '../common/auth';
import { setUserGroupExclusive, setCognitoUserEnabled, globalSignOutUser } from '../common/cognito';
import { registrarAuditoria } from '../common/audit';
import { ok, badRequest, forbidden, notFound, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarSecretaria(event)) return forbidden();
  const memberId = event.pathParameters?.id;
  if (!memberId) return badRequest('Parâmetro id ausente na URL.');

  try {
    const existing = await ddb.send(new GetCommand({ TableName: Tables.members, Key: { memberId } }));
    if (!existing.Item) return notFound('Membro não encontrado.');

    const body = JSON.parse(event.body || '{}');
    const { nome, dataNascimento, dataAssociacao, status, grupo, dependentes, motivo, anexoKey } = body;
    if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
      return badRequest('Informe o motivo desta alteração.');
    }
    const gruposValidos: Grupo[] = ['admin', 'member', 'midia', 'tesouraria', 'secretario'];
    const grupoFinal: Grupo = gruposValidos.includes(grupo) ? grupo : 'member';
    const statusFinal: 'ativo' | 'inativo' = status === 'inativo' ? 'inativo' : 'ativo';

    // Secretário gerencia usuários, mas nunca escala privilégio: não pode editar quem
    // já tem grupo administrativo (admin/tesouraria/secretario, nem a si mesmo) nem
    // promover ninguém pra um desses grupos. Só o próprio admin mexe nessas contas.
    if (
      !isAdmin(event) &&
      (GRUPOS_ADMINISTRATIVOS.includes(existing.Item.grupo) || GRUPOS_ADMINISTRATIVOS.includes(grupoFinal))
    ) {
      return forbidden();
    }

    // Dependente (ex: filho) sem celular/login próprio, pra quem dá dízimo mas não
    // acessa o sistema — fica embutido no cadastro de quem é responsável por ele.
    let dependentesFinal = existing.Item.dependentes ?? [];
    if (Array.isArray(dependentes)) {
      dependentesFinal = dependentes
        .filter((d: any) => d && typeof d.nome === 'string' && d.nome.trim())
        .map((d: any) => ({
          dependenteId: typeof d.dependenteId === 'string' && d.dependenteId ? d.dependenteId : randomUUID(),
          nome: d.nome.trim(),
          dataNascimento: typeof d.dataNascimento === 'string' ? d.dataNascimento : '',
        }));
    }

    const grupoMudou = grupoFinal !== existing.Item.grupo;
    const statusMudou = statusFinal !== existing.Item.status;

    if (grupoMudou) {
      await setUserGroupExclusive(existing.Item.telefone, grupoFinal);
    }
    if (statusMudou) {
      await setCognitoUserEnabled(existing.Item.telefone, statusFinal === 'ativo');
    }
    // Troca de grupo ou desativação: invalida a sessão para o acesso antigo não
    // continuar valendo até o token expirar sozinho.
    if (grupoMudou || (statusMudou && statusFinal === 'inativo')) {
      await globalSignOutUser(existing.Item.telefone);
    }

    const res = await ddb.send(
      new UpdateCommand({
        TableName: Tables.members,
        Key: { memberId },
        UpdateExpression:
          'SET nome = :nome, dataNascimento = :nasc, dataAssociacao = :assoc, #st = :status, grupo = :grupo, dependentes = :dependentes',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':nome': nome ?? existing.Item.nome,
          ':nasc': dataNascimento ?? existing.Item.dataNascimento,
          ':assoc': dataAssociacao ?? existing.Item.dataAssociacao,
          ':status': statusFinal,
          ':grupo': grupoFinal,
          ':dependentes': dependentesFinal,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );

    await registrarAuditoria(event, {
      acao: 'membro.editar',
      entidadeId: memberId,
      detalhes: `${res.Attributes?.nome} (grupo: ${grupoFinal}, status: ${statusFinal})`,
      motivo,
      anexoKey,
    });

    return ok(res.Attributes);
  } catch (err) {
    return serverError(err);
  }
};

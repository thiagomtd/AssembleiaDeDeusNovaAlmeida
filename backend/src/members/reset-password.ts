import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { isAdmin } from '../common/auth';
import { resetUserPassword, globalSignOutUser } from '../common/cognito';
import { registrarAuditoria } from '../common/audit';
import { ok, badRequest, forbidden, notFound, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!isAdmin(event)) return forbidden();
  const memberId = event.pathParameters?.id;
  if (!memberId) return badRequest('Parâmetro id ausente na URL.');

  const { motivo, anexoKey } = JSON.parse(event.body || '{}');
  if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
    return badRequest('Informe o motivo desta ação.');
  }

  try {
    const existing = await ddb.send(new GetCommand({ TableName: Tables.members, Key: { memberId } }));
    if (!existing.Item) return notFound('Membro não encontrado.');

    const senhaTemporaria = await resetUserPassword(existing.Item.telefone);
    // Encerra a sessão atual — a pessoa precisa entrar de novo já com a senha nova.
    await globalSignOutUser(existing.Item.telefone);

    await registrarAuditoria(event, {
      acao: 'membro.resetarSenha',
      entidadeId: memberId,
      detalhes: existing.Item.nome,
      motivo,
      anexoKey,
    });

    return ok({ senhaTemporaria });
  } catch (err) {
    return serverError(err);
  }
};

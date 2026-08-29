import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { isAdmin, type Grupo } from '../common/auth';
import { createCognitoUser, setUserGroup } from '../common/cognito';
import { normalizePhoneBR, isValidE164 } from '../common/phone';
import { registrarAuditoria } from '../common/audit';
import { ok, badRequest, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!isAdmin(event)) return forbidden();
  try {
    const body = JSON.parse(event.body || '{}');
    const { nome, dataNascimento, dataAssociacao, grupo } = body;

    if (!nome || !body.telefone) return badRequest('Campos obrigatórios: nome, telefone.');

    const telefone = normalizePhoneBR(String(body.telefone));
    if (!isValidE164(telefone)) return badRequest('Telefone inválido. Use um número de celular com DDD.');

    const gruposValidos: Grupo[] = ['admin', 'member', 'midia', 'tesouraria'];
    const grupoFinal: Grupo = gruposValidos.includes(grupo) ? grupo : 'member';

    // Cria a conta no Cognito com senha temporária gerada por nós — o SMS automático
    // não é usado (SNS dessa conta ainda sem Production Access) — e vincula ao grupo
    // de acesso escolhido pela administração.
    const { cognitoSub, senhaTemporaria } = await createCognitoUser(telefone, nome);
    await setUserGroup(telefone, grupoFinal);

    const memberId = randomUUID();
    const item = {
      memberId,
      nome,
      telefone,
      dataNascimento: dataNascimento ?? '',
      dataAssociacao: dataAssociacao ?? '',
      status: 'ativo',
      grupo: grupoFinal,
      cognitoSub,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: Tables.members, Item: item }));

    await registrarAuditoria(event, { acao: 'membro.criar', entidadeId: memberId, detalhes: `${nome} (${grupoFinal})` });

    return ok({ ...item, senhaTemporaria }, 201);
  } catch (err: any) {
    if (err?.name === 'UsernameExistsException') {
      return badRequest('Já existe uma conta cadastrada com esse celular.');
    }
    return serverError(err);
  }
};

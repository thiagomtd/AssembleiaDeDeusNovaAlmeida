import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarSecretaria } from '../common/auth';
import { deleteCognitoUser } from '../common/cognito';
import { registrarAuditoria } from '../common/audit';
import { badRequest, forbidden, noContent, notFound, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarSecretaria(event)) return forbidden();
  const memberId = event.pathParameters?.id;
  if (!memberId) return badRequest('Parâmetro id ausente na URL.');

  const { motivo, anexoKey } = JSON.parse(event.body || '{}');
  if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
    return badRequest('Informe o motivo desta exclusão.');
  }

  try {
    const existing = await ddb.send(new GetCommand({ TableName: Tables.members, Key: { memberId } }));
    if (!existing.Item) return notFound('Membro não encontrado.');

    await deleteCognitoUser(existing.Item.telefone);
    await ddb.send(new DeleteCommand({ TableName: Tables.members, Key: { memberId } }));

    await registrarAuditoria(event, { acao: 'membro.remover', entidadeId: memberId, detalhes: existing.Item.nome, motivo, anexoKey });

    return noContent();
  } catch (err) {
    return serverError(err);
  }
};

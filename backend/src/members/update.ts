import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { isAdmin, type Grupo } from '../common/auth';
import { setUserGroupExclusive, setCognitoUserEnabled } from '../common/cognito';
import { ok, badRequest, forbidden, notFound, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!isAdmin(event)) return forbidden();
  const memberId = event.pathParameters?.id;
  if (!memberId) return badRequest('Parâmetro id ausente na URL.');

  try {
    const existing = await ddb.send(new GetCommand({ TableName: Tables.members, Key: { memberId } }));
    if (!existing.Item) return notFound('Membro não encontrado.');

    const body = JSON.parse(event.body || '{}');
    const { nome, dataNascimento, dataAssociacao, status, grupo } = body;
    const gruposValidos: Grupo[] = ['admin', 'member', 'midia', 'tesouraria'];
    const grupoFinal: Grupo = gruposValidos.includes(grupo) ? grupo : 'member';
    const statusFinal: 'ativo' | 'inativo' = status === 'inativo' ? 'inativo' : 'ativo';

    if (grupoFinal !== existing.Item.grupo) {
      await setUserGroupExclusive(existing.Item.telefone, grupoFinal);
    }
    if (statusFinal !== existing.Item.status) {
      await setCognitoUserEnabled(existing.Item.telefone, statusFinal === 'ativo');
    }

    const res = await ddb.send(
      new UpdateCommand({
        TableName: Tables.members,
        Key: { memberId },
        UpdateExpression:
          'SET nome = :nome, dataNascimento = :nasc, dataAssociacao = :assoc, #st = :status, grupo = :grupo',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':nome': nome ?? existing.Item.nome,
          ':nasc': dataNascimento ?? existing.Item.dataNascimento,
          ':assoc': dataAssociacao ?? existing.Item.dataAssociacao,
          ':status': statusFinal,
          ':grupo': grupoFinal,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return ok(res.Attributes);
  } catch (err) {
    return serverError(err);
  }
};

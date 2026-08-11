import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { badRequest, forbidden, noContent, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();

  const campanhaId = event.pathParameters?.id;
  if (!campanhaId) return badRequest('Parâmetro id é obrigatório na URL.');

  try {
    await ddb.send(new DeleteCommand({ TableName: Tables.campanhas, Key: { campanhaId } }));
    return noContent();
  } catch (err) {
    return serverError(err);
  }
};

import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarMidia } from '../common/auth';
import { ok, badRequest, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarMidia(event)) return forbidden();
  try {
    const body = JSON.parse(event.body || '{}');
    const { data, titulo } = body;
    if (!data || !titulo) return badRequest('Campos obrigatórios: data (YYYY-MM-DD), titulo.');

    const item = { cultoId: randomUUID(), data, titulo, createdAt: new Date().toISOString() };
    await ddb.send(new PutCommand({ TableName: Tables.cultos, Item: item }));
    return ok(item, 201);
  } catch (err) {
    return serverError(err);
  }
};

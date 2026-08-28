import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { ok, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();
  try {
    const res = await ddb.send(new ScanCommand({ TableName: Tables.members }));
    const items = (res.Items ?? []).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return ok(items);
  } catch (err) {
    return serverError(err);
  }
};

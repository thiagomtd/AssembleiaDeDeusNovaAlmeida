import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, QUALQUER_GRUPO } from '../common/auth';
import { ok, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, QUALQUER_GRUPO)) return forbidden();

  try {
    const res = await ddb.send(new ScanCommand({ TableName: Tables.campanhas }));
    const itens = (res.Items ?? []).sort((a, b) => {
      if (a.ativa !== b.ativa) return a.ativa ? -1 : 1;
      return (b.createdAt as string).localeCompare(a.createdAt as string);
    });
    return ok(itens);
  } catch (err) {
    return serverError(err);
  }
};

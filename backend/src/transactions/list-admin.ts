import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { presignGet, Buckets } from '../common/s3';
import { ok, badRequest, forbidden, serverError } from '../common/response';

// Visão completa (com o vínculo do dizimista) — usada só por quem gerencia finanças.
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();

  const mes = event.queryStringParameters?.mes;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return badRequest('Parâmetro mes é obrigatório no formato YYYY-MM.');

  try {
    const res = await ddb.send(
      new QueryCommand({
        TableName: Tables.transactions,
        KeyConditionExpression: 'mesAno = :mes',
        ExpressionAttributeValues: { ':mes': mes },
      }),
    );
    const items = await Promise.all(
      (res.Items ?? []).map(async (item) => ({
        ...item,
        comprovanteUrl: item.comprovanteKey ? await presignGet(Buckets.auditoriaAnexos, item.comprovanteKey, 300) : null,
      })),
    );
    return ok(items);
  } catch (err) {
    return serverError(err);
  }
};

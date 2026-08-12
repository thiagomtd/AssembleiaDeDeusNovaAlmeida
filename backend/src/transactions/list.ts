import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, QUALQUER_GRUPO } from '../common/auth';
import { presignGet, Buckets } from '../common/s3';
import { ok, badRequest, forbidden, serverError } from '../common/response';

// Tela de Entradas e Saídas: transparente sobre o fluxo de caixa, mas NUNCA expõe
// a quem um lançamento de dízimo pertence — isso fica só na área interna da administração.
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, QUALQUER_GRUPO)) return forbidden();

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
      (res.Items ?? []).map(async ({ membroId, membroNome, comprovanteKey, ...rest }) => ({
        ...rest,
        comprovanteUrl: comprovanteKey ? await presignGet(Buckets.auditoriaAnexos, comprovanteKey, 300) : null,
      })),
    );
    return ok(items);
  } catch (err) {
    return serverError(err);
  }
};

import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, QUALQUER_GRUPO } from '../common/auth';
import { ok, badRequest, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, QUALQUER_GRUPO)) return forbidden();

  const ano = event.queryStringParameters?.ano;
  if (!ano || !/^\d{4}$/.test(ano)) return badRequest('Parâmetro ano é obrigatório no formato YYYY.');

  try {
    const res = await ddb.send(
      new QueryCommand({
        TableName: Tables.transactions,
        IndexName: 'ano-index',
        KeyConditionExpression: 'ano = :ano',
        ExpressionAttributeValues: { ':ano': ano },
      }),
    );

    const items = (res.Items ?? []).map(({ membroId, membroNome, ...rest }) => rest);

    const porMes: Record<string, { ent: number; sai: number }> = {};
    const porCategoriaEntrada: Record<string, number> = {};
    const porCategoriaSaida: Record<string, number> = {};

    for (const t of items) {
      const mes = String(t.mesAno).slice(5, 7);
      porMes[mes] = porMes[mes] ?? { ent: 0, sai: 0 };
      if (t.tipo === 'entrada') {
        porMes[mes].ent += t.valor;
        porCategoriaEntrada[t.categoria] = (porCategoriaEntrada[t.categoria] ?? 0) + t.valor;
      } else {
        porMes[mes].sai += t.valor;
        porCategoriaSaida[t.categoria] = (porCategoriaSaida[t.categoria] ?? 0) + t.valor;
      }
    }

    return ok({ transacoes: items, porMes, porCategoriaEntrada, porCategoriaSaida });
  } catch (err) {
    return serverError(err);
  }
};

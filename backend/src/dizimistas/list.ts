import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, podeGerenciarFinancas, QUALQUER_GRUPO } from '../common/auth';
import { ok, badRequest, forbidden, serverError } from '../common/response';

// Transparência com privacidade: a quantidade (agregada) fica disponível para
// qualquer membro, usada no relatório mensal. Já os NOMES só ficam visíveis
// para quem gerencia finanças (admin/tesouraria) — a tela de Dizimistas do
// Mês em si é restrita a esses grupos. Nunca expõe o valor de cada
// contribuição (isso fica restrito à administração).
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
        FilterExpression: 'tipo = :entrada AND categoria = :dizimo AND attribute_exists(membroNome)',
        ExpressionAttributeValues: { ':mes': mes, ':entrada': 'entrada', ':dizimo': 'Dízimo' },
      }),
    );

    const nomes = Array.from(new Set((res.Items ?? []).map((t) => t.membroNome as string))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );

    return ok({ mes, quantidade: nomes.length, dizimistas: podeGerenciarFinancas(event) ? nomes : [] });
  } catch (err) {
    return serverError(err);
  }
};

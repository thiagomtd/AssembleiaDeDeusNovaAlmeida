import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, QUALQUER_GRUPO, getSub } from '../common/auth';
import { ok, badRequest, forbidden, serverError } from '../common/response';

// Portal do Membro: cada pessoa só enxerga o próprio extrato (busca o memberId a
// partir do cognitoSub do token, nunca de um parâmetro vindo do cliente), então isso
// não fere a regra de nunca expor o vínculo dizimista↔valor de OUTRA pessoa.
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, QUALQUER_GRUPO)) return forbidden();

  const ano = event.queryStringParameters?.ano;
  if (!ano || !/^\d{4}$/.test(ano)) return badRequest('Parâmetro ano é obrigatório no formato YYYY.');

  const sub = getSub(event);
  if (!sub) return forbidden();

  try {
    const membro = await ddb.send(
      new QueryCommand({
        TableName: Tables.members,
        IndexName: 'cognitoSub-index',
        KeyConditionExpression: 'cognitoSub = :sub',
        ExpressionAttributeValues: { ':sub': sub },
      }),
    );

    const meuMembro = membro.Items?.[0];
    if (!meuMembro) return ok({ ano, nome: null, total: 0, contribuicoes: [] });

    // Dependentes (ex: filho sem celular/login) dão dízimo em nome próprio, mas o
    // extrato aparece pra quem é responsável por eles — busca o histórico de cada um
    // do mesmo jeito que o do titular e junta tudo, marcando de quem é cada linha.
    const dependentes: { dependenteId: string; nome: string }[] = meuMembro.dependentes ?? [];
    const pessoas = [{ id: meuMembro.memberId, nome: meuMembro.nome }, ...dependentes.map((d) => ({ id: d.dependenteId, nome: d.nome }))];

    const resultados = await Promise.all(
      pessoas.map((p) =>
        ddb.send(
          new QueryCommand({
            TableName: Tables.transactions,
            IndexName: 'membroId-index',
            KeyConditionExpression: 'membroId = :id AND begins_with(#data, :ano)',
            ExpressionAttributeNames: { '#data': 'data' },
            ExpressionAttributeValues: { ':id': p.id, ':ano': ano },
          }),
        ),
      ),
    );

    const contribuicoes = resultados
      .flatMap((res, i) =>
        (res.Items ?? [])
          .filter((t) => t.tipo === 'entrada')
          .map((t) => ({ data: t.data, categoria: t.categoria, valor: t.valor, descricao: t.descricao ?? '', pessoa: pessoas[i].nome })),
      )
      .sort((a, b) => a.data.localeCompare(b.data));

    const total = contribuicoes.reduce((acc, c) => acc + c.valor, 0);

    return ok({ ano, nome: meuMembro.nome, total, contribuicoes });
  } catch (err) {
    return serverError(err);
  }
};

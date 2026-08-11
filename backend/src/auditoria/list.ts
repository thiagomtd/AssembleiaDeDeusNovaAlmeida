import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { isAdmin } from '../common/auth';
import { ok, badRequest, forbidden, serverError } from '../common/response';

// Só a diretoria (admin) vê a trilha de auditoria — ela cobre ações de todos os
// domínios (membros, financeiro, campanhas, informações), inclusive de tesouraria/mídia.
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!isAdmin(event)) return forbidden();

  const mes = event.queryStringParameters?.mes;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return badRequest('Parâmetro mes é obrigatório no formato YYYY-MM.');

  try {
    const res = await ddb.send(
      new QueryCommand({
        TableName: Tables.auditoria,
        KeyConditionExpression: 'mesAno = :mes',
        ExpressionAttributeValues: { ':mes': mes },
        ScanIndexForward: false,
      }),
    );

    const nomesPorSub = new Map<string, string>();
    const itens = res.Items ?? [];

    for (const item of itens) {
      const ator = item.ator as string;
      if (!ator || nomesPorSub.has(ator)) continue;
      const membro = await ddb.send(
        new QueryCommand({
          TableName: Tables.members,
          IndexName: 'cognitoSub-index',
          KeyConditionExpression: 'cognitoSub = :sub',
          ExpressionAttributeValues: { ':sub': ator },
        }),
      );
      nomesPorSub.set(ator, (membro.Items?.[0]?.nome as string) ?? item.atorTelefone ?? 'Desconhecido');
    }

    const resultado = itens.map((item) => ({
      timestampId: item.timestampId,
      timestamp: item.timestamp,
      acao: item.acao,
      entidadeId: item.entidadeId,
      detalhes: item.detalhes,
      motivo: item.motivo ?? '',
      atorNome: nomesPorSub.get(item.ator as string) ?? 'Desconhecido',
    }));

    return ok(resultado);
  } catch (err) {
    return serverError(err);
  }
};

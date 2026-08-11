import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { registrarAuditoria } from '../common/audit';
import { ok, badRequest, forbidden, notFound, serverError } from '../common/response';

// arrecadado nunca é editável aqui — só é alterado pelos lançamentos vinculados
// (transactions/create|update|remove), pra nunca perder a consistência com o extrato.
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();

  const campanhaId = event.pathParameters?.id;
  if (!campanhaId) return badRequest('Parâmetro id é obrigatório na URL.');

  try {
    const existing = await ddb.send(new GetCommand({ TableName: Tables.campanhas, Key: { campanhaId } }));
    if (!existing.Item) return notFound('Campanha não encontrada.');

    const body = JSON.parse(event.body || '{}');
    const { titulo, descricao, meta, dataFim, ativa } = body;

    if (!titulo || typeof titulo !== 'string') return badRequest('Campo titulo é obrigatório.');
    if (typeof meta !== 'number' || meta <= 0) return badRequest('Campo meta deve ser um número positivo.');

    const updated = {
      ...existing.Item,
      titulo,
      descricao: descricao ?? existing.Item.descricao,
      meta,
      dataFim: dataFim ?? existing.Item.dataFim,
      ativa: typeof ativa === 'boolean' ? ativa : existing.Item.ativa,
      updatedAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: Tables.campanhas, Item: updated }));

    await registrarAuditoria(event, { acao: 'campanha.editar', entidadeId: campanhaId, detalhes: titulo });

    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
};

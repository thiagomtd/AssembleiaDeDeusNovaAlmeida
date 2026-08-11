import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { ok, badRequest, forbidden, notFound, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();

  const mesAno = event.pathParameters?.mes;
  const transactionId = event.pathParameters?.id;
  if (!mesAno || !transactionId) return badRequest('Parâmetros mes e id são obrigatórios na URL.');

  try {
    const existing = await ddb.send(
      new GetCommand({ TableName: Tables.transactions, Key: { mesAno, transactionId } }),
    );
    if (!existing.Item) return notFound('Lançamento não encontrado.');

    const body = JSON.parse(event.body || '{}');
    const { tipo, valor, categoria, descricao, data, membroId, membroNome } = body;

    if (tipo !== 'entrada' && tipo !== 'saida') return badRequest('Campo tipo deve ser "entrada" ou "saida".');
    if (typeof valor !== 'number' || valor <= 0) return badRequest('Campo valor deve ser um número positivo.');

    // Lançamentos financeiros não mudam de mês na edição (a chave de partição é o mês);
    // para mover de mês, a UI deve excluir e recriar o lançamento no mês certo.
    const updated = {
      ...existing.Item,
      tipo,
      valor,
      categoria: categoria ?? existing.Item.categoria,
      descricao: descricao ?? existing.Item.descricao,
      data: data ?? existing.Item.data,
      membroId: membroId ?? undefined,
      membroNome: membroNome ?? undefined,
      updatedAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: Tables.transactions, Item: updated }));

    const oldSigned = existing.Item.tipo === 'entrada' ? existing.Item.valor : -existing.Item.valor;
    const newSigned = tipo === 'entrada' ? valor : -valor;
    const delta = newSigned - oldSigned;
    if (delta !== 0) {
      await ddb.send(
        new UpdateCommand({
          TableName: Tables.churchInfo,
          Key: { id: 'MAIN' },
          UpdateExpression: 'ADD saldoCaixa :delta',
          ExpressionAttributeValues: { ':delta': delta },
        }),
      );
    }

    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
};

import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { registrarAuditoria } from '../common/audit';
import { badRequest, forbidden, noContent, notFound, serverError } from '../common/response';

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

    await ddb.send(new DeleteCommand({ TableName: Tables.transactions, Key: { mesAno, transactionId } }));

    const signed = existing.Item.tipo === 'entrada' ? existing.Item.valor : -existing.Item.valor;
    await ddb.send(
      new UpdateCommand({
        TableName: Tables.churchInfo,
        Key: { id: 'MAIN' },
        UpdateExpression: 'ADD saldoCaixa :delta',
        ExpressionAttributeValues: { ':delta': -signed },
      }),
    );

    if (existing.Item.tipo === 'entrada' && existing.Item.campanhaId) {
      await ddb.send(
        new UpdateCommand({
          TableName: Tables.campanhas,
          Key: { campanhaId: existing.Item.campanhaId },
          UpdateExpression: 'ADD arrecadado :delta',
          ExpressionAttributeValues: { ':delta': -existing.Item.valor },
        }),
      );
    }

    await registrarAuditoria(event, {
      acao: 'lancamento.remover',
      entidadeId: transactionId,
      detalhes: `${existing.Item.tipo} de R$ ${existing.Item.valor} (${existing.Item.categoria})`,
    });

    return noContent();
  } catch (err) {
    return serverError(err);
  }
};

import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas, getSub } from '../common/auth';
import { ok, badRequest, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();

  try {
    const body = JSON.parse(event.body || '{}');
    const { tipo, valor, categoria, descricao, data, membroId, membroNome, campanhaId, campanhaTitulo } = body;

    if (tipo !== 'entrada' && tipo !== 'saida') return badRequest('Campo tipo deve ser "entrada" ou "saida".');
    if (typeof valor !== 'number' || valor <= 0) return badRequest('Campo valor deve ser um número positivo.');
    if (!categoria || !data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return badRequest('Campos obrigatórios: categoria, data (YYYY-MM-DD).');
    }

    const mesAno = data.slice(0, 7);
    const ano = data.slice(0, 4);
    const transactionId = randomUUID();
    const vinculaCampanha = tipo === 'entrada' && campanhaId;

    const item = {
      mesAno,
      transactionId,
      ano,
      tipo,
      valor,
      categoria,
      descricao: descricao ?? '',
      data,
      membroId: membroId ?? undefined,
      membroNome: membroNome ?? undefined,
      campanhaId: vinculaCampanha ? campanhaId : undefined,
      campanhaTitulo: vinculaCampanha ? campanhaTitulo : undefined,
      criadoPor: getSub(event),
      createdAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: Tables.transactions, Item: item }));

    const delta = tipo === 'entrada' ? valor : -valor;
    await ddb.send(
      new UpdateCommand({
        TableName: Tables.churchInfo,
        Key: { id: 'MAIN' },
        UpdateExpression: 'ADD saldoCaixa :delta',
        ExpressionAttributeValues: { ':delta': delta },
      }),
    );

    if (vinculaCampanha) {
      await ddb.send(
        new UpdateCommand({
          TableName: Tables.campanhas,
          Key: { campanhaId },
          UpdateExpression: 'ADD arrecadado :valor',
          ExpressionAttributeValues: { ':valor': valor },
        }),
      );
    }

    return ok(item, 201);
  } catch (err) {
    return serverError(err);
  }
};

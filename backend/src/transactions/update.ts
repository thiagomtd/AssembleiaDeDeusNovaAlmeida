import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { registrarAuditoria } from '../common/audit';
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
    const { tipo, valor, categoria, descricao, data, membroId, membroNome, campanhaId, campanhaTitulo, motivo, anexoKey, comprovanteKey } = body;

    if (tipo !== 'entrada' && tipo !== 'saida') return badRequest('Campo tipo deve ser "entrada" ou "saida".');
    if (typeof valor !== 'number' || valor <= 0) return badRequest('Campo valor deve ser um número positivo.');
    if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
      return badRequest('Informe o motivo desta alteração.');
    }
    const comprovanteFinal = tipo === 'saida' ? (comprovanteKey || existing.Item.comprovanteKey) : undefined;
    if (tipo === 'saida' && !comprovanteFinal) {
      return badRequest('Anexe um comprovante para registrar uma saída.');
    }

    const vinculaCampanha = tipo === 'entrada' && campanhaId;

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
      campanhaId: vinculaCampanha ? campanhaId : undefined,
      campanhaTitulo: vinculaCampanha ? campanhaTitulo : undefined,
      comprovanteKey: comprovanteFinal,
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

    const campanhaAntiga = existing.Item.tipo === 'entrada' ? (existing.Item.campanhaId as string | undefined) : undefined;
    const campanhaNova = vinculaCampanha ? (campanhaId as string) : undefined;
    if (campanhaAntiga === campanhaNova) {
      if (campanhaNova && delta !== 0) {
        await ddb.send(
          new UpdateCommand({
            TableName: Tables.campanhas,
            Key: { campanhaId: campanhaNova },
            UpdateExpression: 'ADD arrecadado :delta',
            ExpressionAttributeValues: { ':delta': delta },
          }),
        );
      }
    } else {
      if (campanhaAntiga) {
        await ddb.send(
          new UpdateCommand({
            TableName: Tables.campanhas,
            Key: { campanhaId: campanhaAntiga },
            UpdateExpression: 'ADD arrecadado :delta',
            ExpressionAttributeValues: { ':delta': -existing.Item.valor },
          }),
        );
      }
      if (campanhaNova) {
        await ddb.send(
          new UpdateCommand({
            TableName: Tables.campanhas,
            Key: { campanhaId: campanhaNova },
            UpdateExpression: 'ADD arrecadado :valor',
            ExpressionAttributeValues: { ':valor': valor },
          }),
        );
      }
    }

    await registrarAuditoria(event, {
      acao: 'lancamento.editar',
      entidadeId: transactionId,
      detalhes: `${tipo} de R$ ${valor} (${categoria ?? existing.Item.categoria})`,
      motivo,
      anexoKey,
    });

    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
};

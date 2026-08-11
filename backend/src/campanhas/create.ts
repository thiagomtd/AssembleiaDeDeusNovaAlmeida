import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { registrarAuditoria } from '../common/audit';
import { ok, badRequest, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();

  try {
    const body = JSON.parse(event.body || '{}');
    const { titulo, descricao, meta, dataFim } = body;

    if (!titulo || typeof titulo !== 'string') return badRequest('Campo titulo é obrigatório.');
    if (typeof meta !== 'number' || meta <= 0) return badRequest('Campo meta deve ser um número positivo.');

    const item = {
      campanhaId: randomUUID(),
      titulo,
      descricao: descricao ?? '',
      meta,
      arrecadado: 0,
      dataFim: dataFim ?? '',
      ativa: true,
      createdAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: Tables.campanhas, Item: item }));

    await registrarAuditoria(event, { acao: 'campanha.criar', entidadeId: item.campanhaId, detalhes: titulo });

    return ok(item, 201);
  } catch (err) {
    return serverError(err);
  }
};

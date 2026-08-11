import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarFinancas } from '../common/auth';
import { registrarAuditoria } from '../common/audit';
import { badRequest, forbidden, noContent, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();

  const campanhaId = event.pathParameters?.id;
  if (!campanhaId) return badRequest('Parâmetro id é obrigatório na URL.');

  const { motivo } = JSON.parse(event.body || '{}');
  if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
    return badRequest('Informe o motivo desta exclusão.');
  }

  try {
    const existing = await ddb.send(new GetCommand({ TableName: Tables.campanhas, Key: { campanhaId } }));
    await ddb.send(new DeleteCommand({ TableName: Tables.campanhas, Key: { campanhaId } }));

    await registrarAuditoria(event, {
      acao: 'campanha.remover',
      entidadeId: campanhaId,
      detalhes: existing.Item?.titulo ?? '',
      motivo,
    });

    return noContent();
  } catch (err) {
    return serverError(err);
  }
};

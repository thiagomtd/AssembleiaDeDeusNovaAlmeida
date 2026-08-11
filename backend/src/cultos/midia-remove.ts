import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarMidia } from '../common/auth';
import { deleteObject, Buckets } from '../common/s3';
import { registrarAuditoria } from '../common/audit';
import { badRequest, forbidden, noContent, notFound, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarMidia(event)) return forbidden();
  const cultoId = event.pathParameters?.id;
  const mediaId = event.pathParameters?.mediaId;
  if (!cultoId || !mediaId) return badRequest('Parâmetros id e mediaId são obrigatórios na URL.');

  const { motivo } = JSON.parse(event.body || '{}');
  if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
    return badRequest('Informe o motivo desta exclusão.');
  }

  try {
    const existing = await ddb.send(new GetCommand({ TableName: Tables.midia, Key: { cultoId, mediaId } }));
    if (!existing.Item) return notFound('Mídia não encontrada.');

    await deleteObject(Buckets.cultoMedia, existing.Item.s3Key);
    await ddb.send(new DeleteCommand({ TableName: Tables.midia, Key: { cultoId, mediaId } }));

    await registrarAuditoria(event, {
      acao: 'midia.remover',
      entidadeId: mediaId,
      detalhes: `${existing.Item.tipo} no culto ${cultoId}`,
      motivo,
    });

    return noContent();
  } catch (err) {
    return serverError(err);
  }
};

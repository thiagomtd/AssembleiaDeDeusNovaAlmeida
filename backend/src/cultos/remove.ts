import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DeleteCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarMidia } from '../common/auth';
import { deleteObject, Buckets } from '../common/s3';
import { registrarAuditoria } from '../common/audit';
import { badRequest, forbidden, noContent, notFound, serverError } from '../common/response';

// Exclui o culto e, em cascata, todos os itens de mídia associados (S3 + DynamoDB).
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarMidia(event)) return forbidden();
  const cultoId = event.pathParameters?.id;
  if (!cultoId) return badRequest('Parâmetro id ausente na URL.');

  const { motivo, anexoKey } = JSON.parse(event.body || '{}');
  if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
    return badRequest('Informe o motivo desta exclusão.');
  }

  try {
    const culto = await ddb.send(new GetCommand({ TableName: Tables.cultos, Key: { cultoId } }));
    if (!culto.Item) return notFound('Culto não encontrado.');

    const midia = await ddb.send(
      new QueryCommand({
        TableName: Tables.midia,
        KeyConditionExpression: 'cultoId = :id',
        ExpressionAttributeValues: { ':id': cultoId },
      }),
    );
    const items = midia.Items ?? [];

    await Promise.all(
      items.map(async (item) => {
        await deleteObject(Buckets.cultoMedia, item.s3Key);
        await ddb.send(new DeleteCommand({ TableName: Tables.midia, Key: { cultoId, mediaId: item.mediaId } }));
      }),
    );

    await ddb.send(new DeleteCommand({ TableName: Tables.cultos, Key: { cultoId } }));

    await registrarAuditoria(event, {
      acao: 'culto.remover',
      entidadeId: cultoId,
      detalhes: `${culto.Item.titulo} (${items.length} mídia(s) removida(s) junto)`,
      motivo,
      anexoKey,
    });

    return noContent();
  } catch (err) {
    return serverError(err);
  }
};

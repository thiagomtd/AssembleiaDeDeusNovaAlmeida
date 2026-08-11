import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarMidia } from '../common/auth';
import { registrarAuditoria } from '../common/audit';
import { badRequest, forbidden, ok, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarMidia(event)) return forbidden();
  const cultoId = event.pathParameters?.id;
  if (!cultoId) return badRequest('Parâmetro id ausente na URL.');

  try {
    const body = JSON.parse(event.body || '{}');
    const { mediaId, s3Key, tipo, ordem } = body;
    if (!mediaId || !s3Key || (tipo !== 'foto' && tipo !== 'video')) {
      return badRequest('Campos obrigatórios: mediaId, s3Key, tipo ("foto" ou "video").');
    }

    const item = {
      cultoId,
      mediaId,
      s3Key,
      tipo,
      ordem: typeof ordem === 'number' ? ordem : 0,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: Tables.midia, Item: item }));

    await registrarAuditoria(event, { acao: 'midia.criar', entidadeId: mediaId, detalhes: `${tipo} no culto ${cultoId}` });

    return ok(item, 201);
  } catch (err) {
    return serverError(err);
  }
};

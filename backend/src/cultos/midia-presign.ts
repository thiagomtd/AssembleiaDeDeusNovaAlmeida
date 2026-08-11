import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { podeGerenciarMidia } from '../common/auth';
import { presignPut, Buckets } from '../common/s3';
import { badRequest, forbidden, ok, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarMidia(event)) return forbidden();
  const cultoId = event.pathParameters?.id;
  if (!cultoId) return badRequest('Parâmetro id ausente na URL.');

  try {
    const body = JSON.parse(event.body || '{}');
    const { contentType, tipo, extensao } = body;
    if (typeof contentType !== 'string') return badRequest('Campo obrigatório: contentType.');
    if (tipo !== 'foto' && tipo !== 'video') return badRequest('Campo tipo deve ser "foto" ou "video".');

    const mediaId = randomUUID();
    const ext = typeof extensao === 'string' && extensao ? extensao : tipo === 'foto' ? 'jpg' : 'mp4';
    const s3Key = `culto-media/${cultoId}/${mediaId}.${ext}`;
    const uploadUrl = await presignPut(Buckets.cultoMedia, s3Key, contentType, 600);

    return ok({ mediaId, s3Key, uploadUrl });
  } catch (err) {
    return serverError(err);
  }
};

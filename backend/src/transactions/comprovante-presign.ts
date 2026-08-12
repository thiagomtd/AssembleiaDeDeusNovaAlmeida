import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { podeGerenciarFinancas } from '../common/auth';
import { presignPut, Buckets } from '../common/s3';
import { badRequest, forbidden, ok, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarFinancas(event)) return forbidden();

  try {
    const body = JSON.parse(event.body || '{}');
    const { contentType, extensao } = body;
    if (typeof contentType !== 'string') return badRequest('Campo obrigatório: contentType.');

    const comprovanteId = randomUUID();
    const ext = typeof extensao === 'string' && extensao ? extensao : 'bin';
    const comprovanteKey = `comprovantes/${comprovanteId}.${ext}`;
    const uploadUrl = await presignPut(Buckets.auditoriaAnexos, comprovanteKey, contentType, 600);

    return ok({ comprovanteKey, uploadUrl });
  } catch (err) {
    return serverError(err);
  }
};

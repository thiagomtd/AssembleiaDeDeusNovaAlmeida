import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { hasGrupo } from '../common/auth';
import { presignPut, Buckets } from '../common/s3';
import { badRequest, forbidden, ok, serverError } from '../common/response';

// Só quem chega até uma tela de edição/exclusão (admin, mídia, tesouraria ou
// secretário) pode anexar um comprovante ao motivo — visitante/member nunca alteram
// nada no sistema.
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, ['admin', 'midia', 'tesouraria', 'secretario'])) return forbidden();

  try {
    const body = JSON.parse(event.body || '{}');
    const { contentType, extensao } = body;
    if (typeof contentType !== 'string') return badRequest('Campo obrigatório: contentType.');

    const anexoId = randomUUID();
    const ext = typeof extensao === 'string' && extensao ? extensao : 'bin';
    const anexoKey = `auditoria-anexos/${anexoId}.${ext}`;
    const uploadUrl = await presignPut(Buckets.auditoriaAnexos, anexoKey, contentType, 600);

    return ok({ anexoKey, uploadUrl });
  } catch (err) {
    return serverError(err);
  }
};

import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, QUALQUER_GRUPO } from '../common/auth';
import { presignGet, Buckets } from '../common/s3';
import { badRequest, forbidden, ok, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, QUALQUER_GRUPO)) return forbidden();
  const cultoId = event.pathParameters?.id;
  if (!cultoId) return badRequest('Parâmetro id ausente na URL.');

  try {
    const res = await ddb.send(
      new QueryCommand({
        TableName: Tables.midia,
        KeyConditionExpression: 'cultoId = :id',
        ExpressionAttributeValues: { ':id': cultoId },
      }),
    );
    const items = (res.Items ?? []).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

    // URL de visualização (inline, sem forçar download) para renderizar a miniatura
    // real de cada foto/vídeo direto na grade — o download em si tem seu próprio
    // endpoint, que força o cabeçalho attachment.
    const comUrl = await Promise.all(
      items.map(async (item) => ({
        ...item,
        url: await presignGet(Buckets.cultoMedia, item.s3Key, 900),
      })),
    );

    return ok(comUrl);
  } catch (err) {
    return serverError(err);
  }
};

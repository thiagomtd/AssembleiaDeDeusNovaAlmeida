import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, QUALQUER_GRUPO } from '../common/auth';
import { presignGet, Buckets } from '../common/s3';
import { ok, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, QUALQUER_GRUPO)) return forbidden();
  try {
    const res = await ddb.send(new ScanCommand({ TableName: Tables.cultos }));
    const cultos = (res.Items ?? []).sort((a, b) => (a.data < b.data ? 1 : -1));

    const comContagem = await Promise.all(
      cultos.map(async (c) => {
        const midia = await ddb.send(
          new QueryCommand({
            TableName: Tables.midia,
            KeyConditionExpression: 'cultoId = :id',
            ExpressionAttributeValues: { ':id': c.cultoId },
          }),
        );
        const items = (midia.Items ?? []).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

        // Capa do culto: primeira foto (por ordem); se não houver foto, usa o primeiro vídeo.
        const capa = items.find((m) => m.tipo === 'foto') ?? items[0];
        const capaUrl = capa ? await presignGet(Buckets.cultoMedia, capa.s3Key, 900) : null;
        const capaTipo = capa?.tipo ?? null;

        return {
          ...c,
          fotos: items.filter((m) => m.tipo === 'foto').length,
          videos: items.filter((m) => m.tipo === 'video').length,
          capaUrl,
          capaTipo,
        };
      }),
    );

    return ok(comContagem);
  } catch (err) {
    return serverError(err);
  }
};

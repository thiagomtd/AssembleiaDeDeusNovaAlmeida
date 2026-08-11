import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { presignGet, Buckets } from '../common/s3';
import { ok, serverError } from '../common/response';

const LIMITE_HOME = 8;

// Endpoint público (sem login): mostra só a capa de cada culto recente na página
// inicial, como um "teaser". O restante das fotos/vídeos continua exigindo login
// (ver /cultos e /cultos/{id}/midia).
export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const res = await ddb.send(new ScanCommand({ TableName: Tables.cultos }));
    const cultos = (res.Items ?? []).sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, LIMITE_HOME);

    const comCapa = await Promise.all(
      cultos.map(async (c) => {
        const midia = await ddb.send(
          new QueryCommand({
            TableName: Tables.midia,
            KeyConditionExpression: 'cultoId = :id',
            ExpressionAttributeValues: { ':id': c.cultoId },
          }),
        );
        const items = (midia.Items ?? []).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        const capa = items.find((m) => m.tipo === 'foto') ?? items[0];
        const capaUrl = capa ? await presignGet(Buckets.cultoMedia, capa.s3Key, 900) : null;

        return {
          cultoId: c.cultoId,
          data: c.data,
          titulo: c.titulo,
          capaUrl,
          capaTipo: capa?.tipo ?? null,
        };
      }),
    );

    return ok(comCapa.filter((c) => c.capaUrl));
  } catch (err) {
    return serverError(err);
  }
};

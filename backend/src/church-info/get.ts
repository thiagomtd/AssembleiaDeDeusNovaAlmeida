import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { ok, serverError } from '../common/response';

const DEFAULT_INFO = {
  id: 'MAIN',
  textoInstitucional:
    'Uma comunidade de fé, família e esperança. Anunciando o Evangelho e servindo a comunidade de Nova Almeida.',
  endereco: '',
  mapaEmbedUrl: '',
  horarios: [] as { dia: string; horario: string }[],
  saldoCaixa: 0,
};

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const res = await ddb.send(new GetCommand({ TableName: Tables.churchInfo, Key: { id: 'MAIN' } }));
    return ok(res.Item ?? DEFAULT_INFO);
  } catch (err) {
    return serverError(err);
  }
};

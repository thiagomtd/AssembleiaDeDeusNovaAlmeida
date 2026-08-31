import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { podeGerenciarSecretaria } from '../common/auth';
import { registrarAuditoria } from '../common/audit';
import { ok, badRequest, forbidden, serverError } from '../common/response';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!podeGerenciarSecretaria(event)) return forbidden();
  try {
    const body = JSON.parse(event.body || '{}');
    const { textoInstitucional, endereco, mapaEmbedUrl, horarios, motivo, anexoKey } = body;
    if (typeof textoInstitucional !== 'string' || typeof endereco !== 'string') {
      return badRequest('Campos obrigatórios: textoInstitucional, endereco.');
    }
    if (!motivo || typeof motivo !== 'string' || !motivo.trim()) {
      return badRequest('Informe o motivo desta alteração.');
    }

    const current = await ddb.send(new GetCommand({ TableName: Tables.churchInfo, Key: { id: 'MAIN' } }));

    const item = {
      id: 'MAIN',
      textoInstitucional,
      endereco,
      mapaEmbedUrl: mapaEmbedUrl ?? '',
      horarios: Array.isArray(horarios) ? horarios : [],
      saldoCaixa: current.Item?.saldoCaixa ?? 0,
      updatedAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: Tables.churchInfo, Item: item }));

    await registrarAuditoria(event, { acao: 'info.editar', entidadeId: 'MAIN', motivo, anexoKey });

    return ok(item);
  } catch (err) {
    return serverError(err);
  }
};

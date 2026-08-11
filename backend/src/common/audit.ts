import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from './ddb';
import { getSub, getPhone } from './auth';

export type Acao =
  | 'membro.criar' | 'membro.editar' | 'membro.remover'
  | 'lancamento.criar' | 'lancamento.editar' | 'lancamento.remover'
  | 'campanha.criar' | 'campanha.editar' | 'campanha.remover'
  | 'info.editar';

/**
 * Trilha de auditoria (LGPD, art. 37): registra quem fez o quê em ações administrativas
 * sensíveis. Nunca lança erro — uma falha aqui não pode derrubar a operação principal.
 */
export async function registrarAuditoria(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
  params: { acao: Acao; entidadeId: string; detalhes?: string },
): Promise<void> {
  try {
    const agora = new Date();
    const mesAno = agora.toISOString().slice(0, 7);
    const timestampId = `${agora.toISOString()}#${randomUUID()}`;

    await ddb.send(
      new PutCommand({
        TableName: Tables.auditoria,
        Item: {
          mesAno,
          timestampId,
          timestamp: agora.toISOString(),
          acao: params.acao,
          entidadeId: params.entidadeId,
          detalhes: params.detalhes ?? '',
          ator: getSub(event) ?? 'desconhecido',
          atorTelefone: getPhone(event) ?? '',
        },
      }),
    );
  } catch (err) {
    console.error('Falha ao registrar auditoria (ignorada):', err);
  }
}

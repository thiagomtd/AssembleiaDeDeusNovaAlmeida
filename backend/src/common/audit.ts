import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from './ddb';
import { getSub, getPhone } from './auth';

export type Acao =
  | 'membro.criar' | 'membro.editar' | 'membro.remover' | 'membro.resetarSenha'
  | 'lancamento.criar' | 'lancamento.editar' | 'lancamento.remover'
  | 'campanha.criar' | 'campanha.editar' | 'campanha.remover'
  | 'culto.criar' | 'culto.remover'
  | 'midia.criar' | 'midia.remover'
  | 'info.editar'
  | 'login';

interface RegistroAuditoria {
  acao: Acao;
  ator: string;
  atorTelefone: string;
  entidadeId: string;
  detalhes?: string;
  motivo?: string;
  anexoKey?: string;
}

/**
 * Trilha de auditoria (LGPD, art. 37): registra quem fez o quê. Nunca lança erro —
 * uma falha aqui não pode derrubar a operação principal (nem bloquear o login).
 */
async function gravar(registro: RegistroAuditoria): Promise<void> {
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
          acao: registro.acao,
          entidadeId: registro.entidadeId,
          detalhes: registro.detalhes ?? '',
          motivo: registro.motivo ?? '',
          anexoKey: registro.anexoKey ?? '',
          ator: registro.ator,
          atorTelefone: registro.atorTelefone,
        },
      }),
    );
  } catch (err) {
    console.error('Falha ao registrar auditoria (ignorada):', err);
  }
}

/** Usado pelas rotas da API (têm o JWT do API Gateway já validado). */
export async function registrarAuditoria(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
  params: { acao: Acao; entidadeId: string; detalhes?: string; motivo?: string; anexoKey?: string },
): Promise<void> {
  await gravar({
    ...params,
    ator: getSub(event) ?? 'desconhecido',
    atorTelefone: getPhone(event) ?? '',
  });
}

/** Usado pelo trigger Post Authentication do Cognito (formato de evento diferente). */
export async function registrarLogin(sub: string, telefone: string): Promise<void> {
  await gravar({
    acao: 'login',
    entidadeId: sub,
    detalhes: telefone,
    ator: sub,
    atorTelefone: telefone,
  });
}

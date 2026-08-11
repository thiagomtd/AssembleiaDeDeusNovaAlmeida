import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, QUALQUER_GRUPO } from '../common/auth';
import { ok, badRequest, forbidden, serverError } from '../common/response';

// Transparência sem expor dado sensível: mostra nome + dia do aniversário de
// quem faz aniversário no mês, nunca o ano de nascimento (idade).
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, QUALQUER_GRUPO)) return forbidden();

  const mes = event.queryStringParameters?.mes;
  if (!mes || !/^(0[1-9]|1[0-2])$/.test(mes)) return badRequest('Parâmetro mes é obrigatório no formato MM (01-12).');

  try {
    const res = await ddb.send(new ScanCommand({ TableName: Tables.members }));

    const aniversariantes = (res.Items ?? [])
      .filter((m) => m.status === 'ativo' && typeof m.dataNascimento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.dataNascimento))
      .filter((m) => (m.dataNascimento as string).slice(5, 7) === mes)
      .map((m) => ({
        nome: m.nome as string,
        dia: Number((m.dataNascimento as string).slice(8, 10)),
      }))
      .sort((a, b) => a.dia - b.dia || a.nome.localeCompare(b.nome, 'pt-BR'));

    return ok({ mes, quantidade: aniversariantes.length, aniversariantes });
  } catch (err) {
    return serverError(err);
  }
};

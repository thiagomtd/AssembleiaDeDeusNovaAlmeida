import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, Tables } from '../common/ddb';
import { hasGrupo, QUALQUER_GRUPO, getSub } from '../common/auth';
import { ok, forbidden, serverError } from '../common/response';

// LGPD, art. 18: direito de acesso — cada pessoa pode ver exatamente quais dados
// pessoais o sistema guarda sobre ela mesma (nunca sobre outra pessoa).
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  if (!hasGrupo(event, QUALQUER_GRUPO)) return forbidden();

  const sub = getSub(event);
  if (!sub) return forbidden();

  try {
    const res = await ddb.send(
      new QueryCommand({
        TableName: Tables.members,
        IndexName: 'cognitoSub-index',
        KeyConditionExpression: 'cognitoSub = :sub',
        ExpressionAttributeValues: { ':sub': sub },
      }),
    );

    const membro = res.Items?.[0];
    if (!membro) return ok(null);

    return ok({
      nome: membro.nome,
      telefone: membro.telefone,
      dataNascimento: membro.dataNascimento,
      dataAssociacao: membro.dataAssociacao,
      grupo: membro.grupo,
      status: membro.status,
    });
  } catch (err) {
    return serverError(err);
  }
};

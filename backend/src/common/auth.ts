import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export type Grupo = 'admin' | 'member' | 'midia' | 'tesouraria' | 'secretario';

// Todo grupo autenticado tem a base de leitura de "member" (financeiro, dizimistas,
// mídia, relatórios). midia/tesouraria/secretario somam uma responsabilidade específica
// a essa base; admin (diretoria) tem acesso total. Ver [[grupos-cumulativos]] no README.
export const QUALQUER_GRUPO: Grupo[] = ['admin', 'member', 'midia', 'tesouraria', 'secretario'];
export const GRUPOS_FINANCEIRO: Grupo[] = ['admin', 'tesouraria'];
export const GRUPOS_MIDIA: Grupo[] = ['admin', 'midia'];
export const GRUPOS_SECRETARIA: Grupo[] = ['admin', 'secretario'];

/**
 * O frontend envia o ID token (não o access token) como Bearer, pois é o ID token
 * que carrega o claim `cognito:groups`. O HTTP API valida a assinatura/expiração
 * antes do handler ser chamado — aqui só lemos os claims já validados.
 */
export function getGrupos(event: APIGatewayProxyEventV2WithJWTAuthorizer): Grupo[] {
  const raw = event.requestContext.authorizer?.jwt?.claims?.['cognito:groups'];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Grupo[];
  return String(raw)
    .replace(/[[\]]/g, '')
    .split(/[\s,]+/)
    .filter(Boolean) as Grupo[];
}

export function getSub(event: APIGatewayProxyEventV2WithJWTAuthorizer): string | undefined {
  const claims = event.requestContext.authorizer?.jwt?.claims;
  return claims?.sub as string | undefined;
}

export function getPhone(event: APIGatewayProxyEventV2WithJWTAuthorizer): string | undefined {
  const claims = event.requestContext.authorizer?.jwt?.claims;
  return claims?.phone_number as string | undefined;
}

/** Nunca confiar só no frontend: toda rota protegida deve checar o grupo aqui no backend. */
export function hasGrupo(event: APIGatewayProxyEventV2WithJWTAuthorizer, allowed: Grupo[]): boolean {
  const grupos = getGrupos(event);
  return grupos.some((g) => allowed.includes(g));
}

export function isAdmin(event: APIGatewayProxyEventV2WithJWTAuthorizer): boolean {
  return hasGrupo(event, ['admin']);
}

/** admin (diretoria) ou tesouraria: CRUD de lançamentos e visão financeira completa. */
export function podeGerenciarFinancas(event: APIGatewayProxyEventV2WithJWTAuthorizer): boolean {
  return hasGrupo(event, GRUPOS_FINANCEIRO);
}

/** admin (diretoria) ou mídia: CRUD de cultos e mídia (fotos/vídeos). */
export function podeGerenciarMidia(event: APIGatewayProxyEventV2WithJWTAuthorizer): boolean {
  return hasGrupo(event, GRUPOS_MIDIA);
}

/** admin (diretoria) ou secretário: CRUD de membros e edição das informações institucionais. */
export function podeGerenciarSecretaria(event: APIGatewayProxyEventV2WithJWTAuthorizer): boolean {
  return hasGrupo(event, GRUPOS_SECRETARIA);
}

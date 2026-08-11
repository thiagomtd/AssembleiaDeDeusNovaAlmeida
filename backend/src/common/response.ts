import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
};

export function ok(body: unknown, statusCode = 200): APIGatewayProxyStructuredResultV2 {
  return { statusCode, headers, body: JSON.stringify(body) };
}

export function noContent(): APIGatewayProxyStructuredResultV2 {
  return { statusCode: 204, headers };
}

export function badRequest(mensagem: string): APIGatewayProxyStructuredResultV2 {
  return ok({ erro: mensagem }, 400);
}

export function forbidden(mensagem = 'Acesso negado para o seu grupo de usuário.'): APIGatewayProxyStructuredResultV2 {
  return ok({ erro: mensagem }, 403);
}

export function notFound(mensagem = 'Recurso não encontrado.'): APIGatewayProxyStructuredResultV2 {
  return ok({ erro: mensagem }, 404);
}

export function serverError(err: unknown): APIGatewayProxyStructuredResultV2 {
  console.error(err);
  return ok({ erro: 'Erro interno. Tente novamente em instantes.' }, 500);
}

import type { PostAuthenticationTriggerHandler } from 'aws-lambda';
import { registrarLogin } from '../common/audit';

// Disparado pelo Cognito logo após um login bem-sucedido. Precisa SEMPRE devolver o
// evento (nunca lançar erro), senão o Cognito bloqueia o login da pessoa.
export const handler: PostAuthenticationTriggerHandler = async (event) => {
  const sub = event.request.userAttributes.sub;
  const telefone = event.request.userAttributes.phone_number ?? event.userName;
  await registrarLogin(sub, telefone);
  return event;
};

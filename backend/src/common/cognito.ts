import { randomInt } from 'crypto';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminUserGlobalSignOutCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Grupo } from './auth';

export const cognito = new CognitoIdentityProviderClient({});

export const UserPoolId = process.env.USER_POOL_ID as string;

const TODOS_OS_GRUPOS: Grupo[] = ['admin', 'member', 'midia', 'tesouraria'];

export async function createCognitoUser(telefoneE164: string, nomeCompleto: string) {
  const res = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId,
      Username: telefoneE164,
      UserAttributes: [
        { Name: 'phone_number', Value: telefoneE164 },
        { Name: 'phone_number_verified', Value: 'true' },
        { Name: 'name', Value: nomeCompleto },
      ],
      DesiredDeliveryMediums: ['SMS'],
    }),
  );
  return res.User?.Username as string;
}

export async function setUserGroup(username: string, grupo: Grupo) {
  await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId, Username: username, GroupName: grupo }));
}

/** Cada pessoa tem uma única função — trocar de grupo remove das demais para não acumular. */
export async function setUserGroupExclusive(username: string, grupo: Grupo) {
  await Promise.all(
    TODOS_OS_GRUPOS.filter((g) => g !== grupo).map((g) =>
      cognito
        .send(new AdminRemoveUserFromGroupCommand({ UserPoolId, Username: username, GroupName: g }))
        .catch(() => {}),
    ),
  );
  await setUserGroup(username, grupo);
}

export async function deleteCognitoUser(username: string) {
  await cognito.send(new AdminDeleteUserCommand({ UserPoolId, Username: username }));
}

export async function setCognitoUserEnabled(username: string, enabled: boolean) {
  const Command = enabled ? AdminEnableUserCommand : AdminDisableUserCommand;
  await cognito.send(new Command({ UserPoolId, Username: username }));
}

// Sem I/O/0/1 pra não confundir quem for digitar a senha temporária no celular.
const MAIUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULAS = 'abcdefghijkmnpqrstuvwxyz';
const DIGITOS = '23456789';

function gerarSenhaTemporaria(tamanho = 10): string {
  const pool = MAIUSCULAS + MINUSCULAS + DIGITOS;
  const chars = [
    MAIUSCULAS[randomInt(MAIUSCULAS.length)],
    MINUSCULAS[randomInt(MINUSCULAS.length)],
    DIGITOS[randomInt(DIGITOS.length)],
  ];
  while (chars.length < tamanho) chars.push(pool[randomInt(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Gera uma senha temporária nova e força a troca no próximo login (FORCE_CHANGE_PASSWORD). */
export async function resetUserPassword(username: string): Promise<string> {
  const senha = gerarSenhaTemporaria();
  await cognito.send(
    new AdminSetUserPasswordCommand({ UserPoolId, Username: username, Password: senha, Permanent: false }),
  );
  return senha;
}

/**
 * Invalida o refresh token da pessoa — assim que o access/ID token atual expirar
 * (curto, veja idTokenValidity na AuthStack), ela precisa logar de novo e recebe o
 * grupo/status novo. Chamado sempre que o grupo ou o status de acesso mudam.
 */
export async function globalSignOutUser(username: string) {
  await cognito.send(new AdminUserGlobalSignOutCommand({ UserPoolId, Username: username })).catch(() => {});
}

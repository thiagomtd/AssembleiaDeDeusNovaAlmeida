import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
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

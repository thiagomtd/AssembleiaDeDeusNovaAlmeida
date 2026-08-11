import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly adminGroupName = 'admin';
  public readonly memberGroupName = 'member';
  public readonly midiaGroupName = 'midia';
  public readonly tesourariaGroupName = 'tesouraria';

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'icadna-users',
      selfSignUpEnabled: false,
      signInAliases: { phone: true },
      autoVerify: { phone: true },
      standardAttributes: {
        fullname: { required: true, mutable: true },
        phoneNumber: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      // Login e recuperação de senha 100% por celular (SMS) — sem e-mail.
      accountRecovery: cognito.AccountRecovery.PHONE_ONLY_WITHOUT_MFA,
      userInvitation: {
        // Cognito usa {username} e {####} como placeholders; mantido curto para caber em 1 SMS.
        smsMessage:
          'Assembleia de Deus Nova Almeida: seu login e {username}, senha temporaria {####}. Troque no primeiro acesso.',
      },
      enableSmsRole: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'icadna-web',
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: this.adminGroupName,
      description: 'Acesso total ao sistema',
      precedence: 0,
    });

    // Grupos com permissão cumulativa: todo mundo autenticado tem a base de "member"
    // (leitura de financeiro, dizimistas, mídia e relatórios). midia/tesouraria somam
    // uma responsabilidade específica sobre essa base; admin (diretoria) tem tudo.
    new cognito.CfnUserPoolGroup(this, 'MemberGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: this.memberGroupName,
      description: 'Membro da igreja com acesso a financeiro, dizimistas, mídia e relatórios',
      precedence: 30,
    });

    new cognito.CfnUserPoolGroup(this, 'MidiaGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: this.midiaGroupName,
      description: 'Responsável por cultos e mídia (fotos/vídeos), além do acesso base de membro',
      precedence: 20,
    });

    new cognito.CfnUserPoolGroup(this, 'TesourariaGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: this.tesourariaGroupName,
      description: 'Responsável pelas finanças (lançamentos), além do acesso base de membro',
      precedence: 10,
    });

    // Identity Pool provisionado conforme especificação; a autorização de API é feita
    // via Cognito JWT Authorizer (grupos no ID token), não via credenciais do Identity Pool.
    // Fica disponível para uso futuro (ex.: upload direto a S3 com credenciais temporárias).
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: 'icadna_identity_pool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    const authenticatedRole = new cdk.aws_iam.Role(this, 'IdentityPoolAuthRole', {
      assumedBy: new cdk.aws_iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: { 'cognito-identity.amazonaws.com:aud': identityPool.ref },
          'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: { authenticated: authenticatedRole.roleArn },
    });

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
  }
}

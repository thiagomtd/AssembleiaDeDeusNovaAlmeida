import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export interface AuthStackProps extends cdk.StackProps {
  auditoriaTable: dynamodb.Table;
}

const BACKEND_SRC = path.join(__dirname, '..', '..', 'backend', 'src');

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly adminGroupName = 'admin';
  public readonly memberGroupName = 'member';
  public readonly midiaGroupName = 'midia';
  public readonly tesourariaGroupName = 'tesouraria';

  constructor(scope: Construct, id: string, props: AuthStackProps) {
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

    // Trigger do Cognito: registra cada login bem-sucedido na auditoria. Precisa ficar
    // nesta stack (não na ApiStack) porque addTrigger modifica o próprio UserPool — se
    // o Lambda estivesse na ApiStack (que já depende desta stack), criaria um ciclo.
    const postAuthentication = new lambdaNode.NodejsFunction(this, 'PostAuthenticationFn', {
      entry: path.join(BACKEND_SRC, 'auth/post-authentication.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(15),
      environment: { TABLE_AUDITORIA: props.auditoriaTable.tableName },
      bundling: { minify: true },
    });
    props.auditoriaTable.grantWriteData(postAuthentication);
    this.userPool.addTrigger(cognito.UserPoolOperation.POST_AUTHENTICATION, postAuthentication);

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'icadna-web',
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      // Curto de propósito: se o grupo/status de alguém mudar, o token antigo (com o
      // grupo velho) não pode continuar valendo por muito tempo. O refresh token
      // renova isso sozinho em segundo plano enquanto a sessão for válida.
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(15),
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

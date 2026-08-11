import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  membersTable: dynamodb.Table;
  transactionsTable: dynamodb.Table;
  churchInfoTable: dynamodb.Table;
  cultosTable: dynamodb.Table;
  midiaTable: dynamodb.Table;
  cultoMediaBucket: s3.Bucket;
  frontendDistributionDomain: string;
}

const BACKEND_SRC = path.join(__dirname, '..', '..', 'backend', 'src');

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const sharedEnv = {
      TABLE_MEMBERS: props.membersTable.tableName,
      TABLE_TRANSACTIONS: props.transactionsTable.tableName,
      TABLE_CHURCH_INFO: props.churchInfoTable.tableName,
      TABLE_CULTOS: props.cultosTable.tableName,
      TABLE_MIDIA: props.midiaTable.tableName,
      BUCKET_CULTO_MEDIA: props.cultoMediaBucket.bucketName,
      USER_POOL_ID: props.userPool.userPoolId,
    };

    const fn = (id: string, relativeEntry: string, opts?: Partial<lambdaNode.NodejsFunctionProps>) =>
      new lambdaNode.NodejsFunction(this, id, {
        entry: path.join(BACKEND_SRC, relativeEntry),
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_24_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 256,
        timeout: cdk.Duration.seconds(15),
        environment: sharedEnv,
        bundling: { minify: true },
        ...opts,
      });

    // ---------- church-info ----------
    const churchInfoGet = fn('ChurchInfoGetFn', 'church-info/get.ts');
    const churchInfoUpdate = fn('ChurchInfoUpdateFn', 'church-info/update.ts');
    props.churchInfoTable.grantReadData(churchInfoGet);
    props.churchInfoTable.grantReadWriteData(churchInfoUpdate);

    // ---------- members ----------
    const membersList = fn('MembersListFn', 'members/list.ts');
    const membersCreate = fn('MembersCreateFn', 'members/create.ts');
    const membersUpdate = fn('MembersUpdateFn', 'members/update.ts');
    const membersRemove = fn('MembersRemoveFn', 'members/remove.ts');
    props.membersTable.grantReadData(membersList);
    props.membersTable.grantWriteData(membersCreate);
    props.membersTable.grantReadWriteData(membersUpdate);
    props.membersTable.grantReadWriteData(membersRemove);
    const cognitoAdminPolicy = new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminRemoveUserFromGroup',
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:AdminEnableUser',
        'cognito-idp:AdminDisableUser',
      ],
      resources: [props.userPool.userPoolArn],
    });
    [membersCreate, membersUpdate, membersRemove].forEach((f) => f.addToRolePolicy(cognitoAdminPolicy));

    // ---------- transactions ----------
    const transactionsList = fn('TransactionsListFn', 'transactions/list.ts');
    const transactionsListAnnual = fn('TransactionsListAnnualFn', 'transactions/list-annual.ts');
    const transactionsListAdmin = fn('TransactionsListAdminFn', 'transactions/list-admin.ts');
    const transactionsCreate = fn('TransactionsCreateFn', 'transactions/create.ts');
    const transactionsUpdate = fn('TransactionsUpdateFn', 'transactions/update.ts');
    const transactionsRemove = fn('TransactionsRemoveFn', 'transactions/remove.ts');
    props.transactionsTable.grantReadData(transactionsList);
    props.transactionsTable.grantReadData(transactionsListAnnual);
    props.transactionsTable.grantReadData(transactionsListAdmin);
    props.transactionsTable.grantReadWriteData(transactionsCreate);
    props.transactionsTable.grantReadWriteData(transactionsUpdate);
    props.transactionsTable.grantReadWriteData(transactionsRemove);
    [transactionsCreate, transactionsUpdate, transactionsRemove].forEach((f) =>
      props.churchInfoTable.grantReadWriteData(f),
    );

    // ---------- dizimistas ----------
    const dizimistasList = fn('DizimistasListFn', 'dizimistas/list.ts');
    props.transactionsTable.grantReadData(dizimistasList);

    // ---------- aniversariantes ----------
    const aniversariantesList = fn('AniversariantesListFn', 'aniversariantes/list.ts');
    props.membersTable.grantReadData(aniversariantesList);

    // ---------- portal do membro ----------
    const meContribuicoes = fn('MeContribuicoesFn', 'me/contribuicoes.ts');
    props.membersTable.grantReadData(meContribuicoes);
    props.transactionsTable.grantReadData(meContribuicoes);

    // ---------- cultos / mídia ----------
    const cultosList = fn('CultosListFn', 'cultos/list.ts');
    const cultosListPublic = fn('CultosListPublicFn', 'cultos/list-public.ts');
    const cultosCreate = fn('CultosCreateFn', 'cultos/create.ts');
    const cultosRemove = fn('CultosRemoveFn', 'cultos/remove.ts');
    const midiaList = fn('MidiaListFn', 'cultos/midia-list.ts');
    const midiaPresign = fn('MidiaPresignFn', 'cultos/midia-presign.ts');
    const midiaCreate = fn('MidiaCreateFn', 'cultos/midia-create.ts');
    const midiaRemove = fn('MidiaRemoveFn', 'cultos/midia-remove.ts');

    props.cultosTable.grantReadData(cultosList);
    props.cultosTable.grantReadData(cultosListPublic);
    props.cultosTable.grantWriteData(cultosCreate);
    props.cultosTable.grantReadWriteData(cultosRemove);
    props.midiaTable.grantReadData(cultosList);
    props.midiaTable.grantReadData(cultosListPublic);
    props.midiaTable.grantReadData(midiaList);
    props.midiaTable.grantWriteData(midiaCreate);
    props.midiaTable.grantReadWriteData(midiaRemove);
    props.midiaTable.grantReadWriteData(cultosRemove);

    props.cultoMediaBucket.grantPut(midiaPresign);
    props.cultoMediaBucket.grantDelete(midiaRemove);
    props.cultoMediaBucket.grantRead(midiaList);
    props.cultoMediaBucket.grantRead(cultosList);
    props.cultoMediaBucket.grantRead(cultosListPublic);
    props.cultoMediaBucket.grantDelete(cultosRemove);

    // ---------- HTTP API ----------
    const authorizer = new HttpUserPoolAuthorizer('CognitoAuthorizer', props.userPool, {
      userPoolClients: [props.userPoolClient],
      identitySource: ['$request.header.Authorization'],
    });

    const httpApi = new apigw.HttpApi(this, 'HttpApi', {
      apiName: 'icadna-api',
      corsPreflight: {
        allowOrigins: [`https://${props.frontendDistributionDomain}`, 'http://localhost:5173'],
        allowMethods: [
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.PUT,
          apigw.CorsHttpMethod.DELETE,
          apigw.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    const priv = (fnRef: lambdaNode.NodejsFunction) => ({
      integration: new HttpLambdaIntegration('Integration', fnRef),
      authorizer,
    });
    const pub = (fnRef: lambdaNode.NodejsFunction) => ({
      integration: new HttpLambdaIntegration('Integration', fnRef),
    });

    const route = (path: string, methods: apigw.HttpMethod[], target: ReturnType<typeof priv> | ReturnType<typeof pub>) =>
      httpApi.addRoutes({ path, methods, ...target });

    // Público
    route('/church-info', [apigw.HttpMethod.GET], pub(churchInfoGet));
    route('/cultos/public', [apigw.HttpMethod.GET], pub(cultosListPublic));

    // Autenticado (grupo validado dentro de cada Lambda)
    route('/church-info', [apigw.HttpMethod.PUT], priv(churchInfoUpdate));

    route('/members', [apigw.HttpMethod.GET], priv(membersList));
    route('/members', [apigw.HttpMethod.POST], priv(membersCreate));
    route('/members/{id}', [apigw.HttpMethod.PUT], priv(membersUpdate));
    route('/members/{id}', [apigw.HttpMethod.DELETE], priv(membersRemove));

    route('/transactions', [apigw.HttpMethod.GET], priv(transactionsList));
    route('/transactions', [apigw.HttpMethod.POST], priv(transactionsCreate));
    route('/transactions/annual', [apigw.HttpMethod.GET], priv(transactionsListAnnual));
    route('/transactions/{mes}/{id}', [apigw.HttpMethod.PUT], priv(transactionsUpdate));
    route('/transactions/{mes}/{id}', [apigw.HttpMethod.DELETE], priv(transactionsRemove));
    route('/admin/transactions', [apigw.HttpMethod.GET], priv(transactionsListAdmin));

    route('/dizimistas', [apigw.HttpMethod.GET], priv(dizimistasList));
    route('/aniversariantes', [apigw.HttpMethod.GET], priv(aniversariantesList));
    route('/me/contribuicoes', [apigw.HttpMethod.GET], priv(meContribuicoes));

    route('/cultos', [apigw.HttpMethod.GET], priv(cultosList));
    route('/cultos', [apigw.HttpMethod.POST], priv(cultosCreate));
    route('/cultos/{id}', [apigw.HttpMethod.DELETE], priv(cultosRemove));
    route('/cultos/{id}/midia', [apigw.HttpMethod.GET], priv(midiaList));
    route('/cultos/{id}/midia/presign', [apigw.HttpMethod.POST], priv(midiaPresign));
    route('/cultos/{id}/midia', [apigw.HttpMethod.POST], priv(midiaCreate));
    route('/cultos/{id}/midia/{mediaId}', [apigw.HttpMethod.DELETE], priv(midiaRemove));

    new cdk.CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
  }
}

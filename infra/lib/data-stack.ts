import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DataStack extends cdk.Stack {
  public readonly membersTable: dynamodb.Table;
  public readonly transactionsTable: dynamodb.Table;
  public readonly churchInfoTable: dynamodb.Table;
  public readonly cultosTable: dynamodb.Table;
  public readonly midiaTable: dynamodb.Table;
  public readonly campanhasTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tabelas separadas (não single-table design): a igreja tem baixo volume de dados,
    // os access patterns são bem distintos por domínio (membro por id/cognitoSub, lançamento
    // por mês/ano, mídia por culto), e tabelas separadas mantêm cada Lambda simples e os
    // esquemas evoluindo de forma independente sem a complexidade de overloaded keys.

    this.membersTable = new dynamodb.Table(this, 'MembersTable', {
      tableName: 'icadna-members',
      partitionKey: { name: 'memberId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.membersTable.addGlobalSecondaryIndex({
      indexName: 'cognitoSub-index',
      partitionKey: { name: 'cognitoSub', type: dynamodb.AttributeType.STRING },
    });

    // PK = TRANSACTION#<yyyy-mm> permite listar o mês inteiro com uma única Query
    // (tela de Entradas e Saídas). GSI1 (ano) permite consolidar o relatório anual.
    this.transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: 'icadna-transactions',
      partitionKey: { name: 'mesAno', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.transactionsTable.addGlobalSecondaryIndex({
      indexName: 'ano-index',
      partitionKey: { name: 'ano', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'data', type: dynamodb.AttributeType.STRING },
    });
    // Índice esparso: só lançamentos vinculados a um dizimista entram aqui, o que
    // permite ao Portal do Membro buscar o extrato de UMA pessoa sem varrer a tabela.
    this.transactionsTable.addGlobalSecondaryIndex({
      indexName: 'membroId-index',
      partitionKey: { name: 'membroId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'data', type: dynamodb.AttributeType.STRING },
    });

    // Item único (id fixo "MAIN") com texto institucional, endereço, horários de culto
    // e o saldo total em caixa (mantido por incremento atômico a cada lançamento).
    this.churchInfoTable = new dynamodb.Table(this, 'ChurchInfoTable', {
      tableName: 'icadna-church-info',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Um culto = uma data/título; a mídia (fotos/vídeos) fica na MidiaTable com
    // PK=cultoId para listar tudo daquele culto com uma única Query (download em lote).
    this.cultosTable = new dynamodb.Table(this, 'CultosTable', {
      tableName: 'icadna-cultos',
      partitionKey: { name: 'cultoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.midiaTable = new dynamodb.Table(this, 'MidiaTable', {
      tableName: 'icadna-culto-midia',
      partitionKey: { name: 'cultoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'mediaId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Metas de arrecadação (ex: reforma, missões). `arrecadado` é mantido por
    // incremento atômico a cada lançamento vinculado, igual ao saldoCaixa.
    this.campanhasTable = new dynamodb.Table(this, 'CampanhasTable', {
      tableName: 'icadna-campanhas',
      partitionKey: { name: 'campanhaId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}

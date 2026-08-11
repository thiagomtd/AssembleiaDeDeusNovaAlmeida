import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class StorageStack extends cdk.Stack {
  public readonly frontendBucket: s3.Bucket;
  public readonly frontendDistribution: cloudfront.Distribution;
  public readonly cultoMediaBucket: s3.Bucket;
  public readonly auditoriaAnexosBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Frontend estático (S3 privado + CloudFront com OAC) ---
    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    this.frontendDistribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      // SPA: qualquer rota desconhecida (404/403 do S3) cai no index.html do React Router
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    // --- Mídia do culto (S3 privado, SEM CloudFront) ---
    // Acesso somente via URL pré-assinada gerada por Lambda (upload, visualização e
    // a capa "teaser" pública na home) — nunca fica publicamente listável no bucket.
    this.cultoMediaBucket = new s3.Bucket(this, 'CultoMediaBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      lifecycleRules: [
        {
          // limpa zips temporários gerados pelo "baixar tudo"
          prefix: 'zips-temp/',
          expiration: cdk.Duration.days(1),
        },
      ],
    });

    // --- Anexos da trilha de auditoria (S3 privado, SEM CloudFront) ---
    // Comprovante opcional anexado ao motivo de uma edição/exclusão — só acessível via
    // URL pré-assinada, gerada só para quem já tem acesso à tela de Auditoria (admin).
    this.auditoriaAnexosBucket = new s3.Bucket(this, 'AuditoriaAnexosBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', { value: this.frontendBucket.bucketName });
    new cdk.CfnOutput(this, 'FrontendDistributionId', { value: this.frontendDistribution.distributionId });
    new cdk.CfnOutput(this, 'FrontendUrl', { value: `https://${this.frontendDistribution.distributionDomainName}` });
    new cdk.CfnOutput(this, 'CultoMediaBucketName', { value: this.cultoMediaBucket.bucketName });
    new cdk.CfnOutput(this, 'AuditoriaAnexosBucketName', { value: this.auditoriaAnexosBucket.bucketName });
  }
}

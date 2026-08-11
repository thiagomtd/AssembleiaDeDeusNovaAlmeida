#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const prefix = 'Icadna';

const auth = new AuthStack(app, `${prefix}AuthStack`, { env });
const data = new DataStack(app, `${prefix}DataStack`, { env });
const storage = new StorageStack(app, `${prefix}StorageStack`, { env });

new ApiStack(app, `${prefix}ApiStack`, {
  env,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
  membersTable: data.membersTable,
  transactionsTable: data.transactionsTable,
  churchInfoTable: data.churchInfoTable,
  cultosTable: data.cultosTable,
  midiaTable: data.midiaTable,
  campanhasTable: data.campanhasTable,
  auditoriaTable: data.auditoriaTable,
  cultoMediaBucket: storage.cultoMediaBucket,
  frontendDistributionDomain: storage.frontendDistribution.distributionDomainName,
});

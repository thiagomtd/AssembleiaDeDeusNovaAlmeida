import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const Tables = {
  members: process.env.TABLE_MEMBERS as string,
  transactions: process.env.TABLE_TRANSACTIONS as string,
  churchInfo: process.env.TABLE_CHURCH_INFO as string,
  photos: process.env.TABLE_PHOTOS as string,
  cultos: process.env.TABLE_CULTOS as string,
  midia: process.env.TABLE_MIDIA as string,
  campanhas: process.env.TABLE_CAMPANHAS as string,
};

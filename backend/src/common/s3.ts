import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3 = new S3Client({});

export const Buckets = {
  photos: process.env.BUCKET_PHOTOS as string,
  cultoMedia: process.env.BUCKET_CULTO_MEDIA as string,
};

export async function presignPut(bucket: string, key: string, contentType: string, expiresInSeconds = 300) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function presignGet(bucket: string, key: string, expiresInSeconds = 300, downloadFileName?: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(downloadFileName
      ? { ResponseContentDisposition: `attachment; filename="${downloadFileName}"` }
      : {}),
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function deleteObject(bucket: string, key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

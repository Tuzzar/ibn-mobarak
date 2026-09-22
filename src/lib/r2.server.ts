import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "ibn-mobarak-art-gallery";
export const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || "https://pub-4d7495b03d054b119b77e85732daaef0.r2.dev";

export const r2Client = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ||
    "https://438908b03aa19aede226176c6e2ed451.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "ee4720025d4174bfc00dd14f6de272f8",
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY ||
      "097f238cc20cd9f3261b250e7d329b84212c756cd848f8f41df098d052900aa5",
  },
});

export async function uploadToR2(
  key: string,
  body: Uint8Array | Buffer | ArrayBuffer,
  contentType = "image/jpeg",
) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body instanceof Uint8Array ? body : new Uint8Array(body),
      ContentType: contentType,
    }),
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string) {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
  );
}

export async function listR2Files(prefix = "", limit = 100, continuationToken?: string) {
  const res = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      MaxKeys: limit,
      ContinuationToken: continuationToken,
    }),
  );
  return {
    items: (res.Contents || []).map((obj) => ({
      key: obj.Key || "",
      size: obj.Size || 0,
      lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
      url: `${R2_PUBLIC_URL}/${obj.Key}`,
    })),
    nextContinuationToken: res.NextContinuationToken,
    isTruncated: res.IsTruncated,
  };
}

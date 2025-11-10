import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configure R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  file: File,
  folder: string = 'uploads'
): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${folder}/${Date.now()}-${file.name}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    // Return the public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload file to R2');
  }
}

export async function deleteFromR2(fileUrl: string): Promise<void> {
  try {
    // Extract the key from the fileUrl
    // Format: https://pub-xxx.r2.dev/folder/filename
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete file from R2');
  }
}

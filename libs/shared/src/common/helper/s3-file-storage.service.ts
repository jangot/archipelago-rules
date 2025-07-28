import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { IFileStorageService } from './ifile-storage.service';

/**
 * S3 file storage service using AWS SDK v3.
 */
export class S3FileStorageService implements IFileStorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    // TODO: Confirm way in which we're going to connect to AWS
    // Configuration values from environment
    const region = process.env.AWS_REGION;
    const endpoint = process.env.AWS_ENDPOINT_URL ;
    const bucket = process.env.AWS_S3_BUCKET ;
    const isLocal = process.env.IS_LOCAL === '1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'test';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'test';
    
    this.bucket = bucket!;
    
    const credentials = isLocal ? {
      accessKeyId,
      secretAccessKey,
    } : undefined;

    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials,
    });
  }

  /**
   * Writes a stream to S3.
   */
  public async writeStream(path: string, stream: Readable): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: body,
    }));
  }

  /**
   * Reads a file from S3 as a stream.
   */
  public async readStream(path: string): Promise<Readable> {
    const result = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    }));
    const body = result.Body;
    if (body && typeof (body as any).pipe === 'function') {
      return body as Readable;
    }
    throw new Error('S3 Body is not a Readable stream');
  }

  /**
   * Checks if a file exists in S3.
   */
  public async exists(path: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lists files in a prefix in S3.
   */
  public async listFiles(path: string): Promise<string[]> {
    const result = await this.s3.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: path,
    }));
    return (result.Contents || []).map(obj => obj.Key || '').filter(Boolean);
  }

  /**
   * No-op for S3, as prefixes are virtual.
   */
  public async ensureDir(path: string): Promise<void> {
    // No-op for S3
    return;
  }
} 

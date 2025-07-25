import { S3Client } from '@aws-sdk/client-s3';
import { IFileStorageService } from '@library/shared/common/helper/ifile-storage.service';
import { LocalFileStorageService } from '@library/shared/common/helper/local-file-storage.service';
import { S3FileStorageService } from '@library/shared/common/helper/s3-file-storage.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileOriginType } from '../interfaces/file-origin-type.enum';

/**
 * FileStorageFactory resolves the correct IFileStorageService implementation based on origin type.
 */
@Injectable()
export class FileStorageFactory {
  constructor(private readonly configService: ConfigService) {}

  public create(origin: FileOriginType): IFileStorageService {
    const credentials = this.configService.get('IS_LOCAL') === '1' ? {
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', 'test'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', 'test'),
    } : undefined;
    switch (origin) {
      case FileOriginType.Local:
        return new LocalFileStorageService();
      case FileOriginType.S3:
        const s3Client = new S3Client({
          region: this.configService.getOrThrow<string>('AWS_REGION'),
          endpoint: this.configService.getOrThrow<string>('AWS_ENDPOINT_URL'), // LocalStack endpoint
          forcePathStyle: true,
          credentials,
        });
        return new S3FileStorageService(s3Client, 'zng-dev-transfer');
      default:
        throw new Error(`Unsupported file origin: ${origin}`);
    }
  }
} 

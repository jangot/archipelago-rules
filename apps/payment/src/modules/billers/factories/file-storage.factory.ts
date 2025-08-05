import { IFileStorageProvider } from '@library/shared/common/providers/ifile-storage.provider';
import { LocalFileStorageProvider } from '@library/shared/common/providers/local-file-storage.provider';
import { S3FileStorageProvider } from '@library/shared/common/providers/s3-file-storage.provider';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileOriginType } from '../interfaces/file-origin-type.enum';

/**
 * FileStorageFactory resolves the correct IFileStorageService implementation based on origin type.
 */
@Injectable()
export class FileStorageFactory {
  constructor(private readonly configService: ConfigService) {}

  public create(origin: FileOriginType): IFileStorageProvider {
    switch (origin) {
      case FileOriginType.Local:
        return new LocalFileStorageProvider();
      case FileOriginType.S3:
        return new S3FileStorageProvider(this.configService);
      default:
        throw new Error(`Unsupported file origin: ${origin}`);
    }
  }
} 

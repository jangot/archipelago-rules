import { IFileStorageService } from '@library/shared/common/helper/ifile-storage.service';
import { LocalFileStorageService } from '@library/shared/common/helper/local-file-storage.service';
import { S3FileStorageService } from '@library/shared/common/helper/s3-file-storage.service';
import { Injectable } from '@nestjs/common';
import { FileOriginType } from '../interfaces/file-origin-type.enum';

/**
 * FileStorageFactory resolves the correct IFileStorageService implementation based on origin type.
 */
@Injectable()
export class FileStorageFactory {
  public create(origin: FileOriginType): IFileStorageService {
    switch (origin) {
      case FileOriginType.Local:
        return new LocalFileStorageService();
      case FileOriginType.S3:
        return new S3FileStorageService();
      default:
        throw new Error(`Unsupported file origin: ${origin}`);
    }
  }
} 

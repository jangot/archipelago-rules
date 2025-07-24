import { Injectable } from '@nestjs/common';
import { FileOriginType } from '../interfaces/file-origin-type.enum';
import { FileSource } from '../interfaces/file-source.interface';
import { LocalFileSource } from './local-file-source';
import { S3FileSource } from './s3-file-source';

/**
 * FileSourceFactory resolves the correct FileSource implementation based on origin type.
 */
@Injectable()
export class FileSourceFactory {
  constructor(
    private readonly localFileSource: LocalFileSource,
    private readonly s3FileSource: S3FileSource,
  ) {}

  getFileSource(origin: FileOriginType): FileSource {
    switch (origin) {
      case FileOriginType.Local:
        return this.localFileSource;
      case FileOriginType.S3:
        return this.s3FileSource;
      default:
        throw new Error(`Unsupported file origin: ${origin}`);
    }
  }
} 

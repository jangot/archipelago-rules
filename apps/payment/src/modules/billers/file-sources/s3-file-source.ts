import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { FileSource } from '../interfaces/file-source.interface';

/**
 * S3FileSource retrieves files from an S3 bucket as streams.
 * TODO: Implement actual S3 logic.
 */
@Injectable()
export class S3FileSource implements FileSource {
  async getFileStream(resource: string): Promise<Readable> {
    // TODO: Implement S3 file retrieval as a stream
    throw new Error('S3 file streaming not implemented yet.');
  }
} 

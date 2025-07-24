import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { Readable } from 'stream';
import { FileSource } from '../interfaces/file-source.interface';

/**
 * LocalFileSource retrieves files from the local filesystem as streams.
 */
@Injectable()
export class LocalFileSource implements FileSource {
  async getFileStream(resource: string): Promise<Readable> {
    return fs.createReadStream(resource);
  }
} 

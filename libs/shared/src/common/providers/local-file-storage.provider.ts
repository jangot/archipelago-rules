import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, createWriteStream, promises as fsPromises } from 'fs';
import { dirname } from 'path';
import { Readable } from 'stream';
import { IFileStorageProvider } from './ifile-storage.provider';

/**
 * Local file storage service using Node.js fs module.
 */
@Injectable()
export class LocalFileStorageProvider implements IFileStorageProvider {
  private readonly logger: Logger = new Logger(LocalFileStorageProvider.name);

  /**
   * Writes a stream to a local file.
   */
  public async writeStream(path: string, stream: Readable): Promise<void> {
    try {
      await this.ensureDir(dirname(path));
      const writeStream = createWriteStream(path);
      await new Promise<void>((resolve, reject) => {
        stream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        stream.on('error', reject);
      });
    } catch (err: any) {
      this.logger.error(`Failed to write stream to ${path}: ${err.message}`, err);
      throw err;
    }
  }

  /**
   * Reads a local file as a stream.
   */
  public async readStream(path: string): Promise<Readable> {
    try {
      return createReadStream(path);
    } catch (err: any) {
      this.logger.error(`Failed to read stream from ${path}: ${err.message}`, err);
      throw err;
    }
  }

  /**
   * Checks if a file or directory exists.
   */
  public async exists(path: string): Promise<boolean> {
    try {
      await fsPromises.access(path);
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return false;
      }
      this.logger.error(`Error checking existence of ${path}: ${err.message}`, err);
      throw err;
    }
  }

  /**
   * Lists files in a directory.
   */
  public async listFiles(path: string): Promise<string[]> {
    try {
      return await fsPromises.readdir(path);
    } catch (err: any) {
      this.logger.error(`Failed to list files in ${path}: ${err.message}`, err);
      throw err;
    }
  }

  /**
   * Ensures a directory exists, creates it if not.
   */
  public async ensureDir(path: string): Promise<void> {
    try {
      await fsPromises.mkdir(path, { recursive: true });
    } catch (err: any) {
      this.logger.error(`Failed to ensure directory ${path}: ${err.message}`, err);
      throw err;
    }
  }
} 

import { Readable } from 'stream';

/**
 * FileSource abstracts the retrieval of files from different origins (local, S3, etc).
 */
export interface FileSource {
  /**
   * Retrieves the file as a Readable stream given a resource identifier (path, S3 key, etc).
   * @param resource The resource identifier (file path, S3 key, etc)
   */
  getFileStream(resource: string): Promise<Readable>;
} 

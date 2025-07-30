import { Readable } from 'stream';

/**
 * Interface for file storage operations, supporting both local and S3 backends.
 */
export interface IFileStorageProvider {
  /**
   * Writes a stream to the specified path.
   * @param path The destination path (relative or bucket key).
   * @param stream The readable stream to write.
   * @returns Promise that resolves when writing is complete.
   */
  writeStream(path: string, stream: Readable): Promise<void>;

  /**
   * Reads a file as a stream from the specified path.
   * @param path The source path (relative or bucket key).
   * @returns Readable stream of the file contents.
   */
  readStream(path: string): Promise<Readable>;

  /**
   * Reads a file as a string from the specified path.
   * @param path The source path (relative or bucket key).
   * @returns Promise resolving to the file content as string.
   */
  read(path: string): Promise<string>;

  /**
   * Checks if a file or folder exists at the given path.
   * @param path The path to check.
   * @returns Promise resolving to true if exists, false otherwise.
   */
  exists(path: string): Promise<boolean>;

  /**
   * Lists files in a directory or prefix.
   * @param path The directory or prefix to list.
   * @param extension Optional file extension filter (e.g., '.json').
   * @returns Array of full file paths/keys.
   */
  listFiles(path: string, extension?: string): Promise<string[]>;

  /**
   * Creates a directory or prefix if needed (noop for S3).
   * @param path The directory path.
   * @returns Promise that resolves when done.
   */
  ensureDir(path: string): Promise<void>;
} 

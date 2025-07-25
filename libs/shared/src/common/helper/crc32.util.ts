import * as CRC32 from 'crc-32';
import { Readable } from 'stream';

/**
 * Utility for calculating CRC32 checksums.
 */
export class Crc32Util {
  /**
   * Calculates CRC32 checksum for a Buffer.
   * @param buffer The buffer to checksum.
   * @returns The CRC32 checksum as a hex string.
   */
  public static calculateBuffer(buffer: Buffer): string {
    return (CRC32.buf(buffer) >>> 0).toString(16);
  }

  /**
   * Calculates CRC32 checksum for a stream.
   * @param stream The readable stream to checksum.
   * @returns Promise resolving to the CRC32 checksum as a hex string.
   */
  public static async calculateStream(stream: Readable): Promise<string> {
    let crc = 0;
    for await (const chunk of stream) {
      crc = CRC32.buf(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk), crc);
    }
    return (crc >>> 0).toString(16);
  }
} 

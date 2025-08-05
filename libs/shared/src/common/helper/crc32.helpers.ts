import { buf as crc32Buf, str as crc32Str } from 'crc-32';
import { Readable } from 'stream';

export function generateCRC32(input: string): number {
  // crc32 returns a signed 32-bit integer.
  // Using >>> 0 converts it to an unsigned integer.
  return crc32Str(input, 0) >>> 0;
}

export function generateCRC32String(input: string): string {
  const crc32 = generateCRC32(input);
  return crc32.toString();
}

/**
 * Calculates CRC32 from a stream for memory-efficient processing of large files.
 * 
 * @param stream The readable stream to calculate CRC32 from
 * @returns Promise resolving to the CRC32 value
 */
export async function generateCRC32FromStream(stream: Readable): Promise<number> {
  return new Promise((resolve, reject) => {
    let crc32Value = 0;
    
    stream.on('data', (chunk: Buffer) => {
      // Update CRC32 with each chunk
      crc32Value = crc32Buf(chunk, crc32Value);
    });
    
    stream.on('end', () => {
      // Convert to unsigned integer and resolve
      resolve(crc32Value >>> 0);
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

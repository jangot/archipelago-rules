import { str as crc32Str } from 'crc-32';

export function generateCRC32(input: string): number {
  // crc32 returns a signed 32-bit integer.
  // Using >>> 0 converts it to an unsigned integer.
  return crc32Str(input, 0) >>> 0;
}

export function generateCRC32String(input: string): string {
  const crc32 = generateCRC32(input);
  return crc32.toString();
}

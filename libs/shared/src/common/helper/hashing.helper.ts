import { compare, compareSync, hash, hashSync } from 'bcryptjs';

export function createHash(value: string): string {
  return hashSync(value, 12);
}

export function compareHash(value: string, hash: string): boolean {
  return compareSync(value, hash);
}

export async function createHashAsync(value: string): Promise<string> {
  return hash(value, 12);
}

export async function compareHashAsync(value: string, hash: string): Promise<boolean> {
  return compare(value, hash);
}

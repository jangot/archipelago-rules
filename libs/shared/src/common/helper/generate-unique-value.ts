/**
 * Generates a unique value
 * @param baseValue - Base value
 * @returns Unique name with timestamp
 */
export function generateUniqueValue(baseValue: string): string {
  return `${baseValue}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

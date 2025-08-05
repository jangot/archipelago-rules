import { isPlainObject } from 'lodash';

export function flattenObject(obj: Record<string, any>, parentKey = '', result: Record<string, any> = {}): Record<string, any> {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}_${key}`.toUpperCase() : key.toUpperCase();

    if (isPlainObject(value)) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

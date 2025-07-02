import phone from 'phone';

export function transformPhoneNumber(value: string | null): string | null {
  if (!value) {
    return value;
  }

  const result = phone(value, { country: 'USA' });

  return result && result.isValid ? result.phoneNumber : value;
}

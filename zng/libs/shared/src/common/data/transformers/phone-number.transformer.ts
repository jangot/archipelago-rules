import phone from 'phone';

export function transformPhoneNumber(value: string): string {
  const result = phone(value, { country: 'USA' });

  return result && result.isValid ? result.phoneNumber : value;
}

export function generateWrongCode(code: string): string {
  // Convert the string code to a number, increment it by 1, and wrap around at 999999
  const newCode = (parseInt(code, 10) + 1) % 1000000;

  // Pad the new code with leading zeros to ensure it's always 6 digits and return it
  return newCode.toString().padStart(6, '0');
}

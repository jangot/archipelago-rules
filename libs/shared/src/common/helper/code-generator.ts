export function generateSecureCode(digitsLength: number): string {
  if (digitsLength <= 0) {
    throw new Error('Digit length must be greater than 0');
  }

  const cryptoArray = new Uint32Array(1);
  crypto.getRandomValues(cryptoArray);

  const max = Math.pow(10, digitsLength); // Calculate upper limit (e.g., 10^6 for 6 digits)
  const min = Math.pow(10, digitsLength - 1); // Calculate lower limit (e.g., 10^5 for 6 digits)

  // Generate a value between `min` and `max`
  const randomValue = Math.floor(min + (cryptoArray[0] / (0xffffffff + 1)) * (max - min));

  return randomValue.toString(); // Convert result to string
}

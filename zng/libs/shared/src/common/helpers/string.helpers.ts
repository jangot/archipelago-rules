/**
 * Trims the input string if it is defined.
 *
 * @param input - The string to be trimmed. If undefined, the function returns undefined.
 * @returns The trimmed string if the input is defined, otherwise returns the input as is.
 */
export function safeTrim(input: string | undefined): string | undefined {
  return input ? input.trim() : input;
}

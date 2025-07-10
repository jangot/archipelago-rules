export interface ILoanPaymentStepManager {
  /**
  * Advances the payment step to the next state based on the provided step ID.
  * @param stepId The ID of the payment step to advance.
  * @returns A promise that resolves to a boolean indicating success or null if no advancement is possible.
  */
  advance(stepId: string): Promise<boolean | null>;
}

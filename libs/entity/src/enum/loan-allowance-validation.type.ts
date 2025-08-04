/**
 * Enum for Loan Allowance Validation Types
 */
export const LoanAllowanceValidation = {
  Skip: 'skip',
  Any: 'any',
  Borrower: 'borrower',
  Lender: 'lender',
  Biller: 'biller',
} as const;

/**
 * Types of validation for loan allowance
 * - `Skip`: No validation
 * - `Any`: Validate against any allowance (user can be borrower, lender, or biller)
 * - `Borrower`: Validate against borrower allowance
 * - `Lender`: Validate against lender allowance
 * - `Biller`: Validate against biller allowance
 */
export type LoanAllowanceValidationType = typeof LoanAllowanceValidation[keyof typeof LoanAllowanceValidation];

export const LoanApplicationAllowanceValidation = (({ Biller, ...rest }) => rest)(LoanAllowanceValidation);
export type LoanApplicationAllowanceValidationType = typeof LoanApplicationAllowanceValidation[keyof typeof LoanApplicationAllowanceValidation];

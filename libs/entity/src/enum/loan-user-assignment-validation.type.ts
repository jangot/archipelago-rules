/**
 * Enum for Loan Assignment Validation Types
 */
export const LoanUserAssignmentValidation = {
  Skip: 'skip',
  Any: 'any',
  Borrower: 'borrower',
  Lender: 'lender',
  Biller: 'biller',
} as const;

/**
 * Types of validation for loan assignment
 * - `Skip`: No validation
 * - `Any`: Validate against any assignment (user can be borrower, lender, or biller)
 * - `Borrower`: Validate against borrower assignment
 * - `Lender`: Validate against lender assignment
 * - `Biller`: Validate against biller assignment
 */
export type LoanUserAssignmentValidationType = typeof LoanUserAssignmentValidation[keyof typeof LoanUserAssignmentValidation];

export const LoanApplicationUserAssignmentValidation = (({ Biller, ...rest }) => rest)(LoanUserAssignmentValidation);
export type LoanApplicationUserAssignmentValidationType =
  typeof LoanApplicationUserAssignmentValidation[keyof typeof LoanApplicationUserAssignmentValidation];

/** Types generated for queries found in "apps/core/src/infrastructure/sql/bind-target-user-to-loans.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'BindTargetUserToLoans' parameters type */
export interface IBindTargetUserToLoansParams {
  contactUri?: string | null | void;
  userId?: string | null | void;
}

/** 'BindTargetUserToLoans' return type */
export interface IBindTargetUserToLoansResult {
  acceptedAt: Date | null;
  amount: string;
  attachement: string | null;
  billerId: string | null;
  billingAccountNumber: string | null;
  borrowerAccountId: string | null;
  borrowerId: string | null;
  closureType: string | null;
  createdAt: Date;
  currentPaymentIndex: number | null;
  deeplink: string | null;
  feeMode: string | null;
  feeAmount: string | null;
  id: string;
  lenderAccountId: string | null;
  lenderId: string | null;
  nextPaymentDate: Date | null;
  note: string | null;
  paymentFrequency: string;
  paymentsCount: number;
  paymmentAmount: string | null;
  reason: string | null;
  relationship: string | null;
  state: string;
  type: string;
  updatedAt: Date | null;
}

/** 'BindTargetUserToLoans' query type */
export interface IBindTargetUserToLoansQuery {
  params: IBindTargetUserToLoansParams;
  result: IBindTargetUserToLoansResult;
}

const bindTargetUserToLoansIR: any = { 
  usedParamSet: { userId: true, contactUri: true }, 
  params: [{ name: 'userId', required: false, transform: { type: 'scalar' }, locs: [{ a: 103, b: 109 }, { a: 218, b: 224 }] }, { name: 'contactUri', required: false, transform: { type: 'scalar' }, locs: [{ 'a': 277, 'b': 287 }] }], 
  statement: "UPDATE core.loans\nSET\n  borrower_id = CASE\n    WHEN borrower_id IS NULL AND lender_id IS NOT NULL THEN :userId\n    ELSE borrower_id\n  END,\n  lender_id = CASE\n    WHEN lender_id IS NULL AND borrower_id IS NOT NULL THEN :userId\n    ELSE lender_id\n  END\nWHERE\n  target_user_uri = :contactUri\n  AND state <> 'created'\n  AND (borrower_id IS NULL OR lender_id IS NULL)\nRETURNING *" };

/**
 * Query generated from SQL:
 * ```
 * UPDATE core.loans
 * SET
 *   borrower_id = CASE
 *     WHEN borrower_id IS NULL AND lender_id IS NOT NULL THEN :userId
 *     ELSE borrower_id
 *   END,
 *   lender_id = CASE
 *     WHEN lender_id IS NULL AND borrower_id IS NOT NULL THEN :userId
 *     ELSE lender_id
 *   END
 * WHERE
 *   target_user_uri = :contactUri
 *   AND state <> 'created'
 *   AND (borrower_id IS NULL OR lender_id IS NULL)
 * RETURNING *
 * ```
 */
export const bindTargetUserToLoans = new PreparedQuery<IBindTargetUserToLoansParams, IBindTargetUserToLoansResult>(bindTargetUserToLoansIR);



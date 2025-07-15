import { EntityId } from '@library/shared/common/data/id.entity';
import { LoanType } from '../enum';
import { IPaymentAccount } from './ipayment-account';
import { IBiller } from './ibiller';

export interface ILoanApplication extends EntityId<string> {
  // Loan Application
  id: string;
  status: string | null;

  // Biller
  billerName: string | null;
  billerId: string | null;
  biller: IBiller | null;
  billerPostalCode: string | null;
  billAccount: string | null;
  loanAmount: number | null;

  // Lender
  lenderFirstName: string | null;
  lenderLastName: string | null;
  lenderEmail: string | null;
  lenderRelationship: string | null;
  lenderNote: string | null;
  lenderAccountId: string | null;
  lenderAccount: IPaymentAccount | null;

  // Borrower
  borrowerAccountId: string | null;
  borrowerAccount: IPaymentAccount | null;

  // Loan Info
  loanType: LoanType | null;
  loanPayments: number | null;
  loanServiceFee: number | null;
}

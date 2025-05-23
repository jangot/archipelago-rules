import { PaymentStepState } from '../enum';
import { ITransfer } from './itransfer';

export interface ILoanPaymentStep {
  /** UUID */
  id: string;
    
  /** Reference to the parent LoanPayment */
  loanPaymentId: string;
  
  /**
     * Integer order number of the step.
     * Starts with 0.
     */
  order: number;
  
  /** Payment Step transfer amount. Typically the same as Loan Payment amount */
  amount: number;
    
  /** FK to Payment Account from which transfer will be performed */
  sourcePaymentAccountId: string;
    
  /** FK to Payment Account to which transfer will be performed */
  targetPaymentAccountId: string;
  
  /**
     * Collection of Transfers that are part of this Loan Payment Step.
     * Ideally contains only one Transfer.
     * If Transfer failed and re-attempt happened - new Transfer will be referenced to the same Step.
     */
  transfers: ITransfer[] | null;
  
  /**
     * Current state of the Payment Step:
     * 'created' - Step is created but transfers not yet initiated
     * 'pending' - Step's transfer is in progress
     * 'completed' - Step was completed successfully
     * 'failed' - Step failed due to transfer error
     */
  state: PaymentStepState;
  
  /**
     * Indicates what state of the preceding step to wait for before proceeding:
     * 'null' - Do not wait for previous steps (default for first step)
     * 'completed' - Wait for previous step to be completed
     */
  awaitStepState: PaymentStepState | null;
    
  /**
     * Reference to the previous step that must reach awaitStepState before this step can proceed.
     * If null, will use the step with (order-1)
     */
  awaitStepId: string | null;
}

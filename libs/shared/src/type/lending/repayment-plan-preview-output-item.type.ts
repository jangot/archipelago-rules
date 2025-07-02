export interface PlanPreviewOutputItem {
  amount: number;
  index: number;
  paymentsLeft: number;
  paymentDate: Date;
  /** Payments left balance before payment happen */
  beginningBalance: number;
  /** Payments left balance after payment happen */
  endingBalance: number;
}

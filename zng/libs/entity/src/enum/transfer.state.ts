export const TransferStateCodes = {
  Pending: 'pending',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type TransferState = typeof TransferStateCodes[keyof typeof TransferStateCodes];

export const TransferStateCodes = {
  Created: 'created',
  Pending: 'pending',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type TransferState = typeof TransferStateCodes[keyof typeof TransferStateCodes];

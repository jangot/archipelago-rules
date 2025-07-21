export const TransferEventName = {
  TransferExecuted: 'TransferExecuted',
  TransferCompleted: 'TransferCompleted',
  TransferFailed: 'TransferFailed',
} as const;

export type TransferEventNameType = (typeof TransferEventName)[keyof typeof TransferEventName];

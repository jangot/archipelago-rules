export const TransferEventName = {
  TransferExecuted: 'TransferExecuted',
  TransferCompleted: 'TransferCompleted',
  TransferFailed: 'TransferFailed',
} as const;

export type TransferEventNameType = (typeof TransferEventName)[keyof typeof TransferEventName];

export const PaymentStepEventName = {
  PaymentStepPending: 'PaymentStepPending',
  PaymentStepCompleted: 'PaymentStepCompleted',
  PaymentStepFailed: 'PaymentStepFailed',
} as const;

export type PaymentStepEventNameType = (typeof PaymentStepEventName)[keyof typeof PaymentStepEventName];


export const PaymentEventName = {
  PaymentPending: 'PaymentPending',
  PaymentStepped: 'PaymentStepped',
  PaymentCompleted: 'PaymentCompleted',
  PaymentFailed: 'PaymentFailed',
} as const;
export type PaymentEventNameType = (typeof PaymentEventName)[keyof typeof PaymentEventName];

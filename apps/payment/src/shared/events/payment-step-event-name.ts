export const PaymentStepEventName = {
  PaymentStepPending: 'PaymentStepPending',
  PaymentStepCompleted: 'PaymentStepCompleted',
  PaymentStepFailed: 'PaymentStepFailed',
} as const;

export type PaymentStepEventNameType = (typeof PaymentStepEventName)[keyof typeof PaymentStepEventName];

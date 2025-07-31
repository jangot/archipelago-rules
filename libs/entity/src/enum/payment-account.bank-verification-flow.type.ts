export const PaymentAccountBankVerificationFlowCodes = {
  Microdeposits: 'microdeposits',
  IAV: 'iav',
} as const;

export type PaymentAccountBankVerificationFlow = typeof PaymentAccountBankVerificationFlowCodes[keyof typeof PaymentAccountBankVerificationFlowCodes];

export const TransferErrorTypeCodes = {
  Business: 'business',
  Technical: 'technical',
} as const;

export type TransferErrorType = typeof TransferErrorTypeCodes[keyof typeof TransferErrorTypeCodes];

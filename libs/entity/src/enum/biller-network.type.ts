export const BillerNetworkTypeCodes = {
  RPPS: 'rpps',
  OTHER: 'other',
} as const;

export type BillerNetworkType = typeof BillerNetworkTypeCodes[keyof typeof BillerNetworkTypeCodes];

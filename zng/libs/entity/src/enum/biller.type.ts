export const BillerTypeCodes = {
  /** Biller was imported from Billers network (biller_network) */
  Network: 'network',
  /** Biller that was added by User (not found in Billers network) */
  Custom: 'custom',
  /** Emulates the real Biller for P2P Loans */
  Personal: 'personal',
} as const;

export type BillerType = typeof BillerTypeCodes[keyof typeof BillerTypeCodes];

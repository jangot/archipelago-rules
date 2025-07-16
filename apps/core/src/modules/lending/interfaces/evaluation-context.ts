export const EVALUATION_CONTEXT_CODES = {
  FUNDING: {
    COMPLETION: 'funding completion',
    PAUSE: 'funding pause',
    RESUME: 'funding resume',
    FALLBACK: 'funding fallback to accepted',
  },
  DISBURSEMENT: {
    COMPLETION: 'disbursement completion',
    PAUSE: 'disbursement pause', 
    RESUME: 'disbursement resume',
    FALLBACK: 'disbursement fallback to funded',
  },
  REPAYMENT: {
    COMPLETION: 'repayment completion',
    PAUSE: 'repayment pause',
    RESUME: 'repayment resume',
    FALLBACK: 'repayment fallback to closed',
  },
} as const;

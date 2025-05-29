export const TransferErrorCodes = {
  InsufficientFunds: 'insufficient_funds',
  InvalidAccount: 'invalid_account',
  AccountBlocked: 'account_blocked',
  AccountNotFound: 'account_not_found',
  AccountNotSupported: 'account_not_supported',
  NetworkError: 'network_error',
  Timeout: 'timeout',
  InternalError: 'internal_error',
  UnknownError: 'unknown_error',
} as const;

export type TransferErrorCode = typeof TransferErrorCodes[keyof typeof TransferErrorCodes];

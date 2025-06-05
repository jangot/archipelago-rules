export const MessageProviderNames = {
  SQS: 'sqs',
  SNS: 'sns',
  Test: 'test',
} as const;

export type MessageProviderName = typeof MessageProviderNames[keyof typeof MessageProviderNames];

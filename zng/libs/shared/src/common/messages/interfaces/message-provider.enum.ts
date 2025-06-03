export const MessageProviderNames = {
  SQS: 'sqs',
  SNS: 'sns',
} as const;

export type MessageProviderName = typeof MessageProviderNames[keyof typeof MessageProviderNames];

export interface ISnsNotification {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  UnsubscribeURL: string;
  MessageAttributes?: {
    eventClass?: {
      Type: string;
      Value: string;
    };
    eventSource?: {
      Type: string;
      Value: string;
    };
  };
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
}

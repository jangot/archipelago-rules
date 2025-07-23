export interface ISnsNotification {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  UnsubscribeURL: string;
  MessageAttributes: {
    eventType: {
      Type: string;
      Value: string;
    };
    sourceService: {
      Type: string;
      Value: string;
    };
  };
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
}

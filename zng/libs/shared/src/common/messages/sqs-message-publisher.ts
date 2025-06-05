import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { MessagePayloadSqs } from './interfaces/message-payload';
import { Logger } from '@nestjs/common';
import { BaseMessagePublisher } from './base.message-publisher';

export class SqsMessagePublisher extends BaseMessagePublisher<SendMessageCommand> {
  private readonly logger = new Logger(SqsMessagePublisher.name);
  constructor(private readonly sqsClient: SQSClient) {
    super();
  }
  
  protected async createMessagePayload(payload: MessagePayloadSqs, message: string): Promise<SendMessageCommand> {
    return new SendMessageCommand({
      QueueUrl: payload.queueUrl,
      MessageBody: message,
      DelaySeconds: payload.delaySeconds,
      MessageAttributes: payload.messageAttributes,
      MessageSystemAttributes: payload.messageSystemAttributes,
      MessageGroupId: payload.groupId,
      MessageDeduplicationId: payload.deduplicationId,
    });
  }

  protected async sendMessage(message: SendMessageCommand): Promise<string> {
    const result = await this.sqsClient.send(message);

    if (!result.MessageId) {
      this.logger.error('MessageId is required');
      throw new Error('MessageId is required');
    }
    return result.MessageId;
  }
}

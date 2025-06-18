import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { MessagePayloadSqs } from './interfaces/message-payload';
import { Injectable, Logger } from '@nestjs/common';
import { BaseMessagePublisher } from './base.message-publisher';
import { ConfigService } from '@nestjs/config';
import { getSqsClient } from './aws/sqs-client';

@Injectable()
export class SqsMessagePublisher extends BaseMessagePublisher<SendMessageCommand> {
  private readonly logger = new Logger(SqsMessagePublisher.name);
  private sqsClient: SQSClient;

  constructor(protected readonly configService: ConfigService) {
    super();
  }

  // Lazily create the SQS client
  private getSqsClient(): SQSClient {
    if (!this.sqsClient) {
      this.sqsClient = getSqsClient(this.configService);
    }

    return this.sqsClient;
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
    const sqsClient = this.getSqsClient();
    const result = await sqsClient.send(message);

    if (!result.MessageId) {
      this.logger.error('MessageId is required');
      throw new Error('MessageId is required');
    }
    return result.MessageId;
  }
}

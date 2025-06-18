import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { MessagePayloadSqs } from './interfaces/message-payload';
import { Injectable, Logger } from '@nestjs/common';
import { BaseMessagePublisher } from './base.message-publisher';
import { ConfigService } from '@nestjs/config';

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
      this.sqsClient = new SQSClient({
        region: this.configService.getOrThrow<string>('AWS_REGION'),
        profile: this.getSqsCredentials(),
      });
    }

    return this.sqsClient;
  }

  // Credentials are only needed for localstack (local development)
  private getSqsCredentials(): string | undefined {
    return this.configService.get('IS_LOCAL') === '1' ? this.configService.get<string>('AWS_PROFILE') || 'localstack' : undefined;
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

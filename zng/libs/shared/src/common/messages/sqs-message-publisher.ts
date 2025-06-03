import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { IMessagePublisher } from './interfaces/imessagepublisher';
import { MessagePayloads } from './interfaces/message-payload';

export class SqsMessagePublisher implements IMessagePublisher {
  constructor(private readonly sqsClient: SQSClient) {}

  public async publish(payload: MessagePayloads): Promise<string> {
    const command = this.createCommand(payload);
    const result = await this.sqsClient.send(command);
    
    if (!result.MessageId) {
      throw new Error('MessageId is required');
    }

    return result.MessageId;
  }

  private createCommand(payload: MessagePayloads): SendMessageCommand {
    return new SendMessageCommand({
      QueueUrl: payload.queueUrl,
      MessageBody: JSON.stringify(payload.message),
    });
  }
}

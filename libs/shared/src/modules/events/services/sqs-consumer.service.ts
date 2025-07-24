import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { EventsModuleSQSConfig } from '../interface';
import { EventsMapperService } from './events-mapper.service';

@Injectable()
export class SqsConsumerService {
  private logger = new Logger(SqsConsumerService.name);

  private client: SQSClient;
  private queueUrl: string;
  private isRunning = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly eventsMapper: EventsMapperService,
  ) {}

  async start(queueUrl: string, clientConfig: EventsModuleSQSConfig): Promise<void> {
    this.queueUrl = queueUrl;
    this.client = new SQSClient(clientConfig.clientConfig);

    while (this.isRunning) {
      try {
        const newSqsMessages = await this.extractEvents(clientConfig.maxNumberOfMessages || 10, clientConfig.waitTimeSeconds || 3);
        if (!newSqsMessages) {
          continue;
        }

        for (const sqsMessage of newSqsMessages) {
          const cqrsEvent = this.eventsMapper.sqsMessageToCqrsEvent(sqsMessage);
          if (cqrsEvent) {
            await this.eventBus.publish(cqrsEvent);
          } else {
            this.logger.warn({ info: 'Event is not correct', sqsMessage });
          }

          await this.completeEvent(sqsMessage.ReceiptHandle!);
        }
      } catch (err) {
        this.logger.error('SQS polling error:', err);
      }
    }
    this.client.destroy();
  }

  stop() {
    this.isRunning = false;
  }

  private async extractEvents(maxNumberOfMessages: number, waitTimeSeconds: number): Promise<Message[] | undefined> {
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: maxNumberOfMessages,
        WaitTimeSeconds: waitTimeSeconds,
        MessageAttributeNames: ['All'],
      }),
    );

    this.logger.debug(`ReceiveMessageCommand: got ${response.Messages?.length || 0} events`);

    return response.Messages;
  }

  private async completeEvent(receiptHandle: string): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
    this.logger.debug(`DeleteMessageCommand ${receiptHandle}`);
  }
}

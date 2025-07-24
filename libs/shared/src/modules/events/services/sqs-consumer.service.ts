import {
    DeleteMessageCommand,
    Message,
    ReceiveMessageCommand,
    SQSClient,
} from '@aws-sdk/client-sqs';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { EVENTS_MODULE_CONFIG } from '../constants';
import { IEventsModuleConfig } from '../interface';
import { EventsMapperService } from './events-mapper.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(SqsConsumerService.name);

  private client: SQSClient;
  private queueUrl: string;
  private isRunning = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly eventsMapper: EventsMapperService,
    @Inject(EVENTS_MODULE_CONFIG) private readonly config: IEventsModuleConfig,
  ) {}

  public onModuleInit() {
    if (this.config.sqs) {
      this.queueUrl = this.config.sqs.queueUrl;
      this.client = new SQSClient(this.config.sqs.clientConfig);

      this.isRunning = true;
      void this.poll();
    }
  }

  public onModuleDestroy() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
  }

  private async poll(): Promise<void> {
    while (this.isRunning) {
      try {
        const newSqsMessages = await this.extractEvents();
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

    if (this.client) {
      this.client.destroy();
    }
  }

  private async extractEvents(): Promise<Message[] | undefined> {
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: this.config.sqs?.maxNumberOfMessages || 10,
        WaitTimeSeconds: this.config.sqs?.waitTimeSeconds || 3,
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

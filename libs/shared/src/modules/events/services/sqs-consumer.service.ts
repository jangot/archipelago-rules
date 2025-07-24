import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';

import { CoreAbstractEvent } from '../classes';
import { EVENTS_MODULE_CONFIG } from '../constants';
import { IEventsModuleConfig, ISnsNotification } from '../interface';
import { EventsDiscoveryService } from './events-discovery.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(SqsConsumerService.name);

  private client: SQSClient;
  private queueUrl: string;
  private serviceName: string;
  private isRunning = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly eventsDiscovery: EventsDiscoveryService,
    @Inject(EVENTS_MODULE_CONFIG) private readonly config: IEventsModuleConfig,
  ) {}

  public onModuleInit() {
    this.serviceName = this.config.serviceName;
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
        const response = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: this.config.sqs?.maxNumberOfMessages || 10,
            WaitTimeSeconds: this.config.sqs?.waitTimeSeconds || 3,
            MessageAttributeNames: ['All'],
          }),
        );

        if (response.Messages) {
          for (const message of response.Messages) {
            const command = this.getEvent(message);
            if (command) {
              await this.eventBus.publish(command);
            }

            await this.client.send(
              new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle!,
              }),
            );
            this.logger.debug(`DeleteMessageCommand ${message.ReceiptHandle}`);
          }
        }
      } catch (err) {
        this.logger.error('SQS polling error:', err);
      }
    }

    if (this.client) {
      this.client.destroy();
    }
  }

  private getEvent(message: Message): CoreAbstractEvent<any> | null {
    const body: ISnsNotification = JSON.parse(message.Body!);
    if (body.MessageAttributes.sourceService.Value === this.serviceName) {
      this.logger.warn(
        `Get message from myself: ${body.MessageAttributes.eventType.Value}`,
      );
      return null;
    }

    const commandType = body.MessageAttributes.eventType.Value;

    try {
      const EventClass = this.eventsDiscovery.findEventByName(commandType);

      if (EventClass) {
        const command = plainToInstance(EventClass, {
          payload: body.Message,
        });

        this.logger.debug(`Got command ${commandType} ${message.MessageId}`);
        return command as CoreAbstractEvent<any>;
      } else {
        this.logger.warn(`Unknown command type: ${commandType}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error creating command ${commandType}:`, error);
      return null;
    }
  }
}

import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { plainToInstance } from 'class-transformer';

import { IEventsModuleConfig, ISnsNotification } from '../interface';
import { EVENTS_MODULE_CONFIG } from '../constants';
import { CoreAbstractEvent } from '../classes';
import { CommandDiscoveryService } from './command-discovery.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(SqsConsumerService.name);

  private client: SQSClient;
  private queueUrl: string;
  private serviceName: string;
  private isRunning = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly commandDiscovery: CommandDiscoveryService,
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
            const command = this.getCommand(message);
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

  private getCommand(message: Message): CoreAbstractEvent<any> | null {
    const body: ISnsNotification = JSON.parse(message.Body!);
    if (body.MessageAttributes.sourceService.Value === this.serviceName) {
      this.logger.warn(
        `Get message from myself: ${body.MessageAttributes.eventType.Value}`,
      );
      return null;
    }

    const commandType = body.MessageAttributes.eventType.Value;

    try {
      const commandInfo = this.commandDiscovery.findEventByName(commandType);

      if (commandInfo) {
        const command = plainToInstance(commandInfo.eventClass, {
          data: body.Message,
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

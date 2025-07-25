import { Injectable, Logger } from '@nestjs/common';
import { DeleteMessageCommand, Message, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { EventModuleSQSConfig, SqsInstance } from '../';

@Injectable()
export class EventSqsConsumerService {
  private logger = new Logger(EventSqsConsumerService.name);

  getInstance(config: EventModuleSQSConfig): SqsInstance {
    let isRunning = true;
    const client = new SQSClient(config.clientConfig);

    return {
      start: async (cb: (e: Message) => Promise<void>) => {
        this.logger.log(`Pulling from queueUrl: ${config.queueUrl} was started`);

        while (isRunning) {
          try {
            await this.executePullIteration(client, config, cb);
          } catch (error) {
            this.logger.error('Pulling and execution error', error);
          }
        }
        client.destroy();
        this.logger.log(`Pulling from queueUrl: ${config.queueUrl} was finished`);
      },
      finish: () => {
        isRunning = false;
      },
    };
  }

  private async executePullIteration(client: SQSClient, config: EventModuleSQSConfig, cb: (e: Message) => Promise<void>) {
    const newSqsMessages = await this.extractEvents(client, config);
    if (!newSqsMessages) {
      this.logger.debug(`No messages from queueUrl: ${config.queueUrl}`);
      return;
    }

    this.logger.debug(`Got ${newSqsMessages.length} messages from queueUrl: ${config.queueUrl}`);
    for (const sqsMessage of newSqsMessages) {
      try {
        await cb(sqsMessage);
        await this.completeEvent(client, config.queueUrl, sqsMessage.ReceiptHandle!);
        this.logger.debug(`${sqsMessage.ReceiptHandle} execution was finished`);
      } catch (error) {
        this.logger.error(`${sqsMessage.ReceiptHandle} execution error`, error);
      }
    }
  }

  private async extractEvents(client: SQSClient, config: EventModuleSQSConfig): Promise<Message[] | undefined> {
    const response = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: config.queueUrl,
        MaxNumberOfMessages: config.maxNumberOfMessages,
        WaitTimeSeconds: config.waitTimeSeconds,
        MessageAttributeNames: ['All'],
      }),
    );

    return response.Messages;
  }

  private async completeEvent(client: SQSClient, queueUrl: string,  receiptHandle: string): Promise<void> {
    await client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
    this.logger.debug(`DeleteMessageCommand ${receiptHandle}`);
  }
}

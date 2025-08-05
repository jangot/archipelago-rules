import { DeleteMessageCommand, Message, ReceiveMessageCommand, SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { EventModuleSQSQueueOptions, SqsInstance } from '../interface';

@Injectable()
export class EventSqsConsumerService {
  private logger = new Logger(EventSqsConsumerService.name);

  getInstance(config: SQSClientConfig, options: EventModuleSQSQueueOptions): SqsInstance {
    let isRunning = true;
    const client = new SQSClient(config);

    let shutdownResolver: () => void;
    const shutdownPromise = new Promise<void>((resolve) => {
      shutdownResolver = resolve;
    });

    return {
      start: async (cb: (e: Message) => Promise<void>) => {
        this.logger.log(`Pulling from queueUrl: ${options.url} was started`);

        while (isRunning) {
          try {
            await this.executePullIteration(client, options, cb);
          } catch (error) {
            this.logger.error({ info: 'Pulling and execution error', error });
          }
        }

        client.destroy();
        this.logger.log(`Pulling from queueUrl: ${options.url} was finished`);
        shutdownResolver();
      },

      finish: async (): Promise<void> => {
        isRunning = false;
        await shutdownPromise;
      },
    };
  }

  private async executePullIteration(client: SQSClient, options: EventModuleSQSQueueOptions, cb: (e: Message) => Promise<void>) {
    const newSqsMessages = await this.extractEvents(client, options);
    if (!newSqsMessages) {
      this.logger.debug(`No messages from queueUrl: ${options.url}`);
      return;
    }

    this.logger.debug(`Got ${newSqsMessages.length} messages from queueUrl: ${options.url}`);
    for (const sqsMessage of newSqsMessages) {
      try {
        await cb(sqsMessage);
        await this.completeEvent(client, options.url, sqsMessage.ReceiptHandle!);
        this.logger.debug(`${sqsMessage.ReceiptHandle} execution was finished`);
      } catch (error) {
        this.logger.error({ info: `${sqsMessage.ReceiptHandle} execution error`, error });
      }
    }
  }

  private async extractEvents(client: SQSClient, options: EventModuleSQSQueueOptions): Promise<Message[] | undefined> {
    const response = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: options.url,
        MaxNumberOfMessages: options.maxNumberOfMessages,
        WaitTimeSeconds: options.waitTimeSeconds,
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

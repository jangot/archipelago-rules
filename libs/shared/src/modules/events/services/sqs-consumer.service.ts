import { Injectable, Logger } from '@nestjs/common';
import { DeleteMessageCommand, Message, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { EventsModuleSQSConfig, SqsInstance } from '../';

@Injectable()
export class SqsConsumerService {
  private logger = new Logger(SqsConsumerService.name);

  getInstance(config: EventsModuleSQSConfig): SqsInstance {
    let isRunning = true;
    const client = new SQSClient(config.clientConfig);

    return {
      start: async (cb: (e: Message) => Promise<void>) => {
        this.logger.log(`Pulling from queueUrl: ${config.queueUrl} was started`);

        while (isRunning) {
          const newSqsMessages = await this.extractEvents(
            client,
            config.queueUrl,
            config.maxNumberOfMessages,
            config.waitTimeSeconds,
          );
          if (!newSqsMessages) {
            this.logger.debug(`No messages from queueUrl: ${config.queueUrl}`);
            continue;
          }

          this.logger.debug(`Got ${newSqsMessages.length} messages from queueUrl: ${config.queueUrl}`);
          for (const sqsMessage of newSqsMessages) {
            await cb(sqsMessage);
            await this.completeEvent(client, config.queueUrl, sqsMessage.ReceiptHandle!);
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

  private async extractEvents(
    client: SQSClient,
    queueUrl: string,
    maxNumberOfMessages: number,
    waitTimeSeconds: number
  ): Promise<Message[] | undefined> {
    const response = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxNumberOfMessages,
        WaitTimeSeconds: waitTimeSeconds,
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

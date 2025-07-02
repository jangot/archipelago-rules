import { Logger } from '@nestjs/common';
import { BaseMessagePublisher } from './base.message-publisher';
import { MessagePayloadTest } from './interface/message-payload';
import { v4 as uuidv4 } from 'uuid';

interface TestMessageFormat {
  message: string;
}

export class TestMessagePublisher extends BaseMessagePublisher<TestMessageFormat> {
  private readonly logger = new Logger(TestMessagePublisher.name);
  /**
   * Publishes a message to the test message queue.
   * @param payload - The payload to publish.
   * @returns The message.
   */
  protected async createMessagePayload(payload: MessagePayloadTest, message: string): Promise<TestMessageFormat> {
    this.logger.debug(`Creating message payload for test message publisher, message: ${message}`);
    
    return {
      message: payload.message,
    };
  }

  protected async sendMessage(message: TestMessageFormat): Promise<string> {
    const messageId = uuidv4();
    this.logger.debug(`Message sent to test message publisher, messageId: ${messageId}, message: ${message}`);

    return messageId;
  }
}

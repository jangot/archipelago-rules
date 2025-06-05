import { MessagePayloads } from './message-payload';

export interface IMessagePublisher {
  /**
   * Publishes a message to the message queue.
   * @param payload - The payload to publish.
   * @returns The message ID.
   */
  publish(payload: MessagePayloads): Promise<string>;
}

export const IMessagePublisher = Symbol('IMessagePublisher');

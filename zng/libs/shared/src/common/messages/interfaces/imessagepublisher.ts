import { MessagePayloads } from './message-payload';

export interface IMessagePublisher {
  publish(payload: MessagePayloads): Promise<string>;
}

export const IMessagePublisher = Symbol('IMessagePublisher');

import { IMessagePublisher } from './interfaces/imessagepublisher';
import { MessagePayloads } from './interfaces/message-payload';

export abstract class BaseMessagePublisher<T extends object> implements IMessagePublisher {

  public async publish(payload: MessagePayloads): Promise<string> {
    const message = JSON.stringify(payload.message);
    const messagePayload = await this.createMessagePayload(payload, message);

    const result = await this.sendMessage(messagePayload);

    if (!result) {
      throw new Error('MessageId is required');
    }

    return result;
  }

  protected abstract createMessagePayload(payload: MessagePayloads, message: string): Promise<T>;

  protected abstract sendMessage(message: T): Promise<string>;
}

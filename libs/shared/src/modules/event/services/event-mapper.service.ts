import { PublishCommand } from '@aws-sdk/client-sns';
import { Message } from '@aws-sdk/client-sqs';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import {
  IEventModuleConfig,
  ISnsNotification,
  ZirtueBaseEvent,
  ZirtueDistributedEvent,
} from '../';
import { ZIRTUE_EVENT_MODULE_CONFIG } from '../constants';
import { EventDiscoveryService } from './event-discovery.service';

@Injectable()
export class EventMapperService {
  constructor(
    private readonly eventsDiscovery: EventDiscoveryService,
    @Inject(ZIRTUE_EVENT_MODULE_CONFIG) private readonly config: IEventModuleConfig,
  ) {}

  public cqrsEventToSnsCommand<T extends ZirtueDistributedEvent<any>>(event: T, topicArn: string): PublishCommand {
    return new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(event.payload),
      MessageAttributes: {
        eventClass: {
          DataType: 'String',
          StringValue: event.constructor.name,
        },
        eventSource: {
          DataType: 'String',
          StringValue: this.config.serviceName + '_',
        },
      },
    });
  }

  /**
   * Converts SQS message to CQRS event.
   *
   * Automatically restores data types in payload if payload is a class.
   * For Date fields, use @Type(() => Date) decorator in the payload class.
   *
   * @param sqsMessage - SQS message to convert
   * @returns Converted event or null if event is not found or not suitable for current service
   *
   * @example
   * ```typescript
   * // Creating payload class with Date fields
   * import { Type } from 'class-transformer';
   *
   * export class UserActivityPayload {
   *   userId: string;
   *
   *   @Type(() => Date)
   *   createdAt: Date;
   *
   *   @Type(() => Date)
   *   lastLoginAt: Date;
   *
   *   activityType: string;
   * }
   *
   * // Creating event with payload type specification
   * export class UserActivityEvent extends ZirtueDistributedEvent<UserActivityPayload> {
   *   static readonly payloadType = UserActivityPayload;
   * }
   *
   * // During deserialization, Date fields are automatically converted from strings to Date objects
   * const event = eventMapper.sqsMessageToCqrsEvent(sqsMessage);
   * // event.payload.createdAt will be a Date object, not a string
   * ```
   */
  public sqsMessageToCqrsEvent(sqsMessage: Message): ZirtueDistributedEvent<any> | null {
    const body: ISnsNotification = JSON.parse(sqsMessage.Body!);
    if (body.MessageAttributes?.eventSource?.Value === this.config.serviceName || !body.MessageAttributes?.eventClass) {
      return null;
    }

    const eventClass = this.eventsDiscovery.findEventByName(body.MessageAttributes.eventClass.Value);
    if (!eventClass) {
      return null;
    } else {
      const rawPayload = JSON.parse(body.Message);

      const payloadType = this.getPayloadType(eventClass);

      const transformedPayload = payloadType
        ? plainToInstance(payloadType, rawPayload)
        : rawPayload;

      const event = new eventClass(transformedPayload);
      return event as ZirtueBaseEvent<any>;
    }
  }

  private getPayloadType(eventClass: any): any {
    // Получаем тип payload из generic параметра события
    return eventClass.payloadType || null;
  }
}

import { PublishCommand } from '@aws-sdk/client-sns';
import { Message } from '@aws-sdk/client-sqs';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import {
  ZirtueBaseEvent,
  ZirtueDistributedEvent,
  IEventModuleConfig,
  ISnsNotification,
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
    const Message = JSON.stringify(event.payload);
    return new PublishCommand({
      TopicArn: topicArn,
      Message,
      MessageAttributes: {
        eventClass: {
          DataType: 'String',
          StringValue: event.constructor.name,
        },
        eventSource: {
          DataType: 'String',
          StringValue: this.config.serviceName,
        },
      },
    });
  }

  public sqsMessageToCqrsEvent(sqsMessage: Message): ZirtueDistributedEvent<any> | null {
    const body: ISnsNotification = JSON.parse(sqsMessage.Body!);
    if (body.MessageAttributes.eventSource?.Value === this.config.serviceName || !body.MessageAttributes.eventClass) {
      return null;
    }

    const EventClass = this.eventsDiscovery.findEventByName(body.MessageAttributes.eventClass.Value);
    if (!EventClass) {
      return null;
    } else {
      // TODO add body.Message validation
      // But a structure of the data must be described manually for all events
      const command = plainToInstance(EventClass, {
        payload: body.Message,
      });

      return command as ZirtueBaseEvent<any>;
    }
  }
}

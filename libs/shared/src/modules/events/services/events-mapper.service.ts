import { PublishCommand } from '@aws-sdk/client-sns';
import { Message } from '@aws-sdk/client-sqs';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import {
  CoreAbstractEvent,
  CorePublishedEvent,
  EVENTS_MODULE_CONFIG,
  IEventsModuleConfig,
  ISnsNotification,
} from '../';
import { EventsDiscoveryService } from './events-discovery.service';

@Injectable()
export class EventsMapperService {
  constructor(
    private readonly eventsDiscovery: EventsDiscoveryService,
    @Inject(EVENTS_MODULE_CONFIG) private readonly config: IEventsModuleConfig,
  ) {}

  public cqrsEventToSnsCommand<T extends CorePublishedEvent<any>>(event: T, topicArn: string): PublishCommand {
    const Message = JSON.stringify(event.payload);
    return new PublishCommand({
      TopicArn: topicArn,
      Message,
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: event.constructor.name,
        },
        sourceService: {
          DataType: 'String',
          StringValue: this.config.serviceName,
        },
      },
    });
  }

  public sqsMessageToCqrsEvent(sqsMessage: Message): CorePublishedEvent<any> | null {
    const body: ISnsNotification = JSON.parse(sqsMessage.Body!);
    if (body.MessageAttributes.sourceService.Value === this.config.serviceName) {
      return null;
    }

    const EventClass = this.eventsDiscovery.findEventByName(body.MessageAttributes.eventType.Value);
    if (!EventClass) {
      return null;
    } else {
      // TODO add body.Message validation
      // But a structure of the data must be described manually for all events
      const command = plainToInstance(EventClass, {
        payload: body.Message,
      });

      return command as CoreAbstractEvent<any>;
    }
  }
}

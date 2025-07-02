import { Injectable, Logger } from '@nestjs/common';
import { IDomainServices } from '@core/modules/domain/idomain.services';
import { EventBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScheduleService {
  private readonly logger: Logger = new Logger(ScheduleService.name);
    
  constructor(
    private readonly domainServices: IDomainServices, 
    private readonly eventBus: EventBus,
    private readonly config: ConfigService,) {}
}

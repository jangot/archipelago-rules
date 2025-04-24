import { IDomainServices } from '@core/domain/idomain.services';
import { LendingBaseCommand } from './lending.commands';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export abstract class LendingBaseCommandHandler<TCommand extends LendingBaseCommand, TResponse> {
  protected readonly domainServices: IDomainServices;
  protected readonly logger: Logger;
  protected readonly eventBus: EventBus;
  protected readonly config: ConfigService;

  constructor(domainServices: IDomainServices, logger: Logger, eventBus: EventBus, config: ConfigService) {
    this.domainServices = domainServices;
    this.logger = logger;
    this.eventBus = eventBus;
    this.config = config;
  }
  
  public abstract execute(command: TCommand): Promise<TResponse>;
}

import { Injectable } from '@nestjs/common';
import { RegistrationDto } from '../dto';
import { RegistrationType } from '@library/entity/enum';
import { OrganicRegistrationFlow } from './registration/registration-flow.organic';
import { SandboxRegistrationFlow } from './registration/registration-flow.sandbox';
import { RegistrationFlow } from './registration';
import { IDataService } from '../data/idata.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CommandBus, EventBus } from '@nestjs/cqrs';

@Injectable()
export class RegistrationFactory {
  public static create(
    type: RegistrationType,
    data: IDataService,
    jwtService: JwtService,
    config: ConfigService,
    eventBus: EventBus,
    commandBus: CommandBus
  ): RegistrationFlow<RegistrationType, RegistrationDto> {
    switch (type) {
      case RegistrationType.Organic:
        return new OrganicRegistrationFlow(data, jwtService, config, eventBus, commandBus);
      case RegistrationType.SandboxBypass:
        return new SandboxRegistrationFlow(data, jwtService, config, eventBus, commandBus);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { RegistrationDto } from '../dto';
import { RegistrationType } from '@library/entity/enum';
import { OrganicRegistrator } from './registration/registrator.organic';
import { SandboxRegistrator } from './registration/registrator.sandbox';
import { RegistratorBase } from './registration';
import { IDataService } from '../data/idata.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class RegistrationFactory {
  public static getRegistrator(
    type: RegistrationType,
    data: IDataService,
    jwtService: JwtService,
    config: ConfigService,
    usersService: UsersService
  ): RegistratorBase<RegistrationType, RegistrationDto> | null {
    switch (type) {
      case RegistrationType.Organic:
        return new OrganicRegistrator(data, jwtService, config, usersService);
      case RegistrationType.SandboxBypass:
        return new SandboxRegistrator(data, jwtService, config, usersService);
    }
  }
}

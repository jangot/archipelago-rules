import { Injectable } from '@nestjs/common';
import { OrganicRegistrationRequestDto, RegistrationDto, SandboxRegistrationRequestDto } from '../dto';
import { RegistrationType } from '@library/entity/enum';
import { OrganicRegistrator } from './registration/registrator.organic';
import { SandboxRegistrator } from './registration/registrator.sandbox';

@Injectable()
export class RegistrationFactory {
  constructor(
    private readonly organic: OrganicRegistrator,
    private readonly sandbox: SandboxRegistrator
  ) {}

  public async advance(input: RegistrationDto, token: string | null): Promise<void> {
    const { type } = input;

    // TODO: think more about types - TS should automatically handle type, w/o need for casting
    switch (type) {
      case RegistrationType.Organic:
        return await this.organic.advance(input as OrganicRegistrationRequestDto, token);
      case RegistrationType.SandboxBypass:
        return await this.sandbox.advance(input as SandboxRegistrationRequestDto, token);
    }
  }
}

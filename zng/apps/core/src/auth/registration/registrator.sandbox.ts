import { Injectable } from '@nestjs/common';
import { RegistratorBase } from './registrator.base';
import { RegistrationStageTransition } from './stage-transition.interface';
import { SandboxRegistrationRequestDto } from '../../dto';
import { LoginType, RegistrationType } from '@library/entity/enum';

@Injectable()
export class SandboxRegistrator extends RegistratorBase<RegistrationType.SandboxBypass, SandboxRegistrationRequestDto> {
  protected supportedRegistrationLogins = [LoginType.OneTimeCodeEmail, LoginType.OneTimeCodePhoneNumber];
  protected stageTransitions: RegistrationStageTransition[];
}

import { Injectable } from '@nestjs/common';
import { RegistrationFlow } from './registration-flow.base';
import { RegistrationStageTransition } from './stage-transition.interface';
import { SandboxRegistrationRequestDto } from '../../dto';
import { LoginType, RegistrationType } from '@library/entity/enum';

@Injectable()
export class SandboxRegistrationFlow extends RegistrationFlow<
  RegistrationType.SandboxBypass,
  SandboxRegistrationRequestDto
> {
  protected supportedRegistrationLogins = [LoginType.OneTimeCodeEmail, LoginType.OneTimeCodePhoneNumber];
  protected stageTransitions: RegistrationStageTransition[];
}

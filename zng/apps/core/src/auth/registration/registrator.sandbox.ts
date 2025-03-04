import { Injectable } from '@nestjs/common';
import { RegistratorBase } from './registrator.base';
import { RegistrationStageTransition } from './stage-transition.interface';
import { SandboxRegistrationRequestDto } from '../../dto';

@Injectable()
export class SandboxRegistrator extends RegistratorBase<SandboxRegistrationRequestDto> {
  protected stageTransitions: RegistrationStageTransition[];
}

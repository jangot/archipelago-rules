import { Injectable } from '@nestjs/common';
import { RegistratorBase } from './registrator.base';
import { RegistrationStageTransition } from './stage-transition.interface';
import { OrganicRegistrationData } from '@library/entity/interface';
import { SandboxRegistrationRequestDto } from '../../dto';

@Injectable()
export class SandboxRegistrator extends RegistratorBase<OrganicRegistrationData, SandboxRegistrationRequestDto> {
  protected stageTransitions: RegistrationStageTransition[];
}

import { Injectable } from '@nestjs/common';
import { RegistratorBase } from './registrator.base';
import { OrganicRegistrationRequestDto } from '../../dto';
import { OrganicRegistrationData } from '@library/entity/interface';
import { RegistrationStageTransition } from './stage-transition.interface';

@Injectable()
export class OrganicRegistrator extends RegistratorBase<OrganicRegistrationData, OrganicRegistrationRequestDto> {
  protected stageTransitions: RegistrationStageTransition[];
}

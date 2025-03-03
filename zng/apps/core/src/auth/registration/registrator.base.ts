import { RegistrationStage } from '@library/entity/enum';
import { RegistrationDto } from '../../dto';
import { IDataService } from '../../data/idata.service';
import { Registration } from '../../data/entity';
import { RegistrationStageTransition } from './stage-transition.interface';
import { JwtService } from '@nestjs/jwt';

export abstract class RegistratorBase<D extends object, I extends RegistrationDto> {
  protected abstract stageTransitions: RegistrationStageTransition[];

  constructor(
    protected readonly data: IDataService,
    protected readonly jwtService: JwtService
  ) {}

  public async advance(input: I, token: string | null): Promise<void> {
    // Initial step of registration
    if (!token) {
      const transition = this.stageTransitions.find((t) => !t.from);
      if (!transition) {
        throw new Error('No initial transition found');
      }
      return this.next(transition.to, undefined, undefined, input);
    }

    // All other registration steps for multi-step registrations
    const tokenPayload = this.jwtService.decode(token) as { id: string };

    const registration = await this.getRegistrationState(tokenPayload.id);
    const transition = this.stageTransitions.find((t) => t.from === registration?.stage);
    return this.next(transition!.to, registration?.stage, tokenPayload.id, input);
  }

  protected stringifyPayload(payload: D): string {
    return JSON.stringify(payload);
  }

  protected parsePayload(payload: string): D {
    return JSON.parse(payload) as D;
  }

  protected async getRegistrationState(id: string | null): Promise<Registration | null> {
    if (!id) return null;
    return await this.data.registrations.findOneBy({ id });
  }

  protected next(
    targetStage: RegistrationStage,
    currentStage?: RegistrationStage,
    id?: string,
    input?: I
  ): Promise<void> {
    const transition = this.stageTransitions.find((t) => t.to === targetStage && t.from === currentStage);
    if (!transition) {
      throw new Error(`No transition found from ${currentStage} to ${targetStage}`);
    }
    return transition.action(id, input);
  }
}

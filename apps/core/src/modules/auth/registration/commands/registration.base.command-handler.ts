/*
 * File Name   : registration.base.command-handler.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { IDomainServices } from '@core/modules/domain/idomain.services';
import { IApplicationUser } from '@library/entity/entity-interface';
import { RegistrationStatus } from '@library/entity/enum';
import { IEventPublisher } from '@library/shared/common/event/interface/ieventpublisher';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RegistrationDto } from '../../dto/request/registration.request.dto';
import { VerificationEvent, VerificationEventFactory } from '../../verification';
import { RegistrationTransitionResult } from '../registration-transition-result';
import { RegistrationBaseCommand } from './registration.commands';

export interface RegistrationExecuteParams {
  id: string | null;
  input: RegistrationDto | null;
}

@Injectable()
export abstract class RegistrationBaseCommandHandler<TCommand extends RegistrationBaseCommand = RegistrationBaseCommand> {
  
  constructor(protected readonly domainServices: IDomainServices, protected readonly logger: Logger,
    @Inject(IEventPublisher) protected readonly eventPublisher: IEventPublisher) {
  }

  public abstract execute(command: TCommand): Promise<RegistrationTransitionResult>;

  /**
   * Creates a registration transition result.
   * @param state - The current registration status.
   * @param isSuccessful - Whether the transition was successful.
   * @param message - The transition message.
   * @param userId - The user ID.
   * @param loginId - The login ID.
   * @param code - The verification code.
   * @param accessToken - The access token.
   * @param refreshToken - The refresh token.
   
   * @returns A RegistrationTransitionResultDto.
   */
  protected createTransitionResult(
    state: RegistrationStatus,
    isSuccessful: boolean,
    userId?: string,
    loginId?: string,
    code?: string,
    accessToken?: string,
    refreshToken?: string
  ): RegistrationTransitionResult {
    return { state, isSuccessful, userId, loginId, code, accessToken, refreshToken };
  }

  protected sendEvent(user: IApplicationUser | null, event: VerificationEvent | null): void {
    if (!event || !user) return;
    const eventInstance = VerificationEventFactory.create(user, event);
    if (!eventInstance) return;
    this.eventPublisher.publish(eventInstance);
  }
}

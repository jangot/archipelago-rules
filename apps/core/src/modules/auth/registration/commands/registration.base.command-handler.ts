/*
 * File Name   : registration.base.command-handler.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { IDomainServices } from '@core/modules/domain/idomain.services';
import { RegistrationStatus } from '@library/entity/enum';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegistrationDto } from '../../dto/request/registration.request.dto';
import { VerificationEvent, VerificationEventFactory } from '../../verification';
import { RegistrationTransitionResult } from '../registration-transition-result';
import { RegistrationBaseCommand } from './registration.commands';
import { ApplicationUser } from '@library/shared/domain/entity';
import { EventsPublisherService } from '@library/shared/modules/events2';

export interface RegistrationExecuteParams {
  id: string | null;
  input: RegistrationDto | null;
}

@Injectable()
export abstract class RegistrationBaseCommandHandler<TCommand extends RegistrationBaseCommand = RegistrationBaseCommand> {

  constructor(protected readonly domainServices: IDomainServices, protected readonly logger: Logger,
    protected readonly eventManager: EventsPublisherService, protected readonly config: ConfigService) {
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

  protected sendEvent(user: ApplicationUser | null, event: VerificationEvent | null): void {
    if (!event || !user) return;
    const eventInstance = VerificationEventFactory.create(user, event);
    if (!eventInstance) return;
    this.eventManager.publish(eventInstance);
  }

  protected isDevelopmentEnvironment(): boolean {
    return this.config.get<string>('NODE_ENV', 'production') === 'development';
  }
}

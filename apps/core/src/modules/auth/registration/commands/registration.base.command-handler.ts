/*
 * File Name   : registration.base.command-handler.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { IDomainServices } from '@core/modules/domain/idomain.services';
import { RegistrationStatus } from '@library/entity/enum';
import { ApplicationUser } from '@library/shared/domain/entity';
import { EventPublisherService } from '@library/shared/modules/event';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthBaseCommandHandler } from '../../common/auth.base.command-handler';
import { RegistrationDto } from '../../dto/request/registration.request.dto';
import { VerificationEvent, VerificationEventFactory } from '../../verification';
import { RegistrationTransitionResult } from '../registration-transition-result';
import { RegistrationBaseCommand } from './registration.commands';

export interface RegistrationExecuteParams {
  id: string | null;
  input: RegistrationDto | null;
}

@Injectable()
export abstract class RegistrationBaseCommandHandler<TCommand extends RegistrationBaseCommand = RegistrationBaseCommand>
  extends AuthBaseCommandHandler {

  constructor(
    protected readonly domainServices: IDomainServices,
    protected readonly publisherService: EventPublisherService,
    protected readonly logger: Logger,
    protected readonly config: ConfigService
  ) {
    super(domainServices, publisherService, config);
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
    void this.publisherService.publish(eventInstance);
  }
}

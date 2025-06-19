/*
 * File Name   : registration.base.command-handler.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationStatus } from '@library/entity/enum';
import { Injectable, Logger } from '@nestjs/common';
import { RegistrationBaseCommand } from './registration.commands';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { IApplicationUser } from '@library/entity/interface';
import { RegistrationTransitionResult } from '@library/shared/types';
import { RegistrationDto } from '@core/dto';
import { IDomainServices } from '@core/domain/idomain.services';
import { VerificationEvent, VerificationEventFactory } from '@core/auth/verification';

export interface RegistrationExecuteParams {
  id: string | null;
  input: RegistrationDto | null;
}

@Injectable()
export abstract class RegistrationBaseCommandHandler<TCommand extends RegistrationBaseCommand = RegistrationBaseCommand> {
  protected readonly domainServices: IDomainServices;
  protected readonly logger: Logger;
  protected readonly commandBus: CommandBus;
  protected readonly eventBus: EventBus;

  constructor(domainServices: IDomainServices, logger: Logger, commandBus: CommandBus, eventBus: EventBus) {
    this.domainServices = domainServices;
    this.logger = logger;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
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
    this.eventBus.publish(eventInstance);
  }
}

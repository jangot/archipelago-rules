/*
 * File Name   : registration.base.command-handler.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationStatus } from '@library/entity/enum';
import { Injectable, Logger } from '@nestjs/common';
import { RegistrationDto, RegistrationTransitionMessage, RegistrationTransitionResultDto } from '../../../dto';
import { RegistrationBaseCommand } from './registration.commands';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { IApplicationUser, IUserRegistration } from '@library/entity/interface';
import { VerificationEvent, VerificationEventFactory } from '../../verification';
import { generateSecureCode } from '@library/shared/common/helpers';
import { Transactional } from 'typeorm-transactional';
import { IDataService } from '../../../data/idata.service';
import { IDomainServices } from '../../../domain/idomain.services';

export interface RegistrationParams {
  data: IDataService;
  logger: Logger;
}

export interface RegistrationExecuteParams {
  id: string | null;
  input: RegistrationDto | null;
}

@Injectable()
export abstract class RegistrationBaseCommandHandler<
  TCommand extends RegistrationBaseCommand = RegistrationBaseCommand,
> {
  protected readonly data: IDataService;
  protected readonly domainServices: IDomainServices;
  protected readonly logger: Logger;
  protected readonly commandBus: CommandBus;
  protected readonly eventBus: EventBus;

  constructor(
    data: IDataService,
    domainServices: IDomainServices,
    logger: Logger,
    commandBus: CommandBus,
    eventBus: EventBus
  ) {
    this.data = data;
    this.domainServices = domainServices;
    this.logger = logger;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
  }

  public abstract execute(command: TCommand): Promise<RegistrationTransitionResultDto>;

  /**
   * Creates a registration transition result.
   * @param state - The current registration status.
   * @param isSuccessful - Whether the transition was successful.
   * @param message - The transition message.
   * @param userId - The user ID.
   * @param code - The verification code.
   * @returns A RegistrationTransitionResultDto.
   */
  protected createTransitionResult(
    state: RegistrationStatus,
    isSuccessful: boolean,
    message: RegistrationTransitionMessage | null,
    userId?: string,
    code?: string
  ): RegistrationTransitionResultDto {
    return {
      state,
      isSuccessful,
      message,
      userId,
      code,
    };
  }

  protected async getUserRegistration(userId: string): Promise<IUserRegistration | null> {
    return this.data.userRegistrations.getByUserId(userId);
  }

  protected sendEvent(user: IApplicationUser | null, event: VerificationEvent | null): void {
    if (!event || !user) return;
    const eventInstance = VerificationEventFactory.create(user, event);
    if (!eventInstance) return;
    this.eventBus.publish(eventInstance);
  }

  protected generateCode(): { code: string; expiresAt: Date } {
    const code = generateSecureCode(6);
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now
    return { code, expiresAt };
  }

  @Transactional()
  protected async updateEntities<T extends readonly unknown[] | []>(values: T): Promise<void> {
    await Promise.all(values);
  }
}

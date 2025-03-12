/*
 * File Name   : registration.base.command-handler.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationStatus, RegistrationType } from '@library/entity/enum';
import { Logger } from '@nestjs/common';
import { UserRegistration } from 'apps/core/src/data/entity';
import { IDataService } from 'apps/core/src/data/idata.service';
import { RegistrationDto, RegistrationTransitionMessage, RegistrationTransitionResultDto } from 'apps/core/src/dto';
import { RegistrationBaseCommand } from './registration.commands';
import { CommandBus } from '@nestjs/cqrs';

export interface RegistrationParams {
  data: IDataService;
  logger: Logger;
}

export interface RegistrationExecuteParams<Type extends RegistrationType = RegistrationType> {
  id: string | null;
  input: (RegistrationDto & { type: Type }) | null;
}

export abstract class RegistrationBaseCommandHandler<
  TType extends RegistrationType = RegistrationType,
  TCommand extends RegistrationBaseCommand<TType> = RegistrationBaseCommand<TType>,
> {
  protected readonly data: IDataService;
  protected readonly logger: Logger;
  protected readonly commandBus: CommandBus;

  constructor(data: IDataService, logger: Logger, commandBus: CommandBus) {
    this.data = data;
    this.logger = logger;
    this.commandBus = commandBus;
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

  protected async getUserRegistration(userId: string): Promise<UserRegistration | null> {
    return this.data.userRegistrations.getByUserId(userId);
  }
}

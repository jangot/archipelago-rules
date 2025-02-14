/*
 * File Name   : core.controller.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Controller, Get, Query } from '@nestjs/common';
import { CoreService } from './core.service';
import { ApiQuery } from '@nestjs/swagger';

@Controller()
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  // Need to turn this into an Integration test!!!
  @Get('transactional')
  @ApiQuery({ name: 'shouldFail', required: false, description: 'Should this crash or not?' })
  public async transactional(@Query('shouldFail') shouldFail: boolean): Promise<{ message: string }> {
    const result = await this.coreService.transactionalTest(shouldFail);

    return { message: result ? 'Transaction committed' : 'Transaction rolled back' };
  }
}

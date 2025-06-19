/*
 * File Name   : core.controller.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CoreService } from './core.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SqsService } from '@ssut/nestjs-sqs';

@Controller()
@ApiTags('core')
export class CoreController {
  constructor(private readonly coreService: CoreService, private readonly sqsService: SqsService) {}

  // Need to turn this into an Integration test!!!
  @Get('transactional')
  @ApiQuery({ name: 'shouldFail', required: false, description: 'Should this crash or not?' })
  public async transactional(@Query('shouldFail') shouldFail: boolean): Promise<{ message: string }> {
    const result = await this.coreService.transactionalTest(shouldFail);

    return { message: result ? 'Transaction committed' : 'Transaction rolled back' };
  }

  @Post('publish')
  public async publish(@Body() body: { id: string, body: string }): Promise<{ message: string }> {
    const result = await this.sqsService.send('ZNG_Producer', body);

    return { message: result ? 'Message published' : 'Message not published' };
  }
}

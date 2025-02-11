/*
 * File Name   : core.controller.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Controller, Get, HttpException } from '@nestjs/common';
import { CoreService } from './core.service';
import { UUIDParam } from '@library/shared/common/pipes/uuidparam';
import { ApiParam, ApiOkResponse, ApiNoContentResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { plainToClass } from 'class-transformer';
import { isEmail } from 'class-validator';
import { EmailParam } from '@library/shared/common/pipes/emailparam';
import { UserResponseDto } from '@library/dto/response';


@Controller()
export class CoreController {
  constructor(private readonly coreService: CoreService) {}
  
  // Need to turn this into an Integration test!!!
  @Get('transactional')
  public async transactional(): Promise<void> {
    return await this.coreService.transactionalTest();
  }

  // **** Obviously these should be in a User Controller class ****
  // Example fleshed out endpoint with:
  // 1. Proper Swagger documentation
  // 2. Parameter validation
  // 3. Explicit return types
  @Get(':id')
  @ApiParam({name: 'id', required: true, description: 'User id'})
  @ApiOkResponse({description: 'Get User by Id', type: UserResponseDto, isArray: false})
  @ApiNoContentResponse({description: 'User not found', isArray: false})
  @ApiBadRequestResponse({description: 'Invalid Id', isArray: false})
  public async get(@UUIDParam('id') id: string): Promise<UserResponseDto> {
    const result = await this.coreService.getUserById(id);

    if (!result) {
      throw new HttpException('User not found', HttpStatusCode.NoContent);
    }

    // plainToClass method is useful for converting from one JS type to another with Love...
    return plainToClass(UserResponseDto, result, {excludeExtraneousValues: true});
  }

  @Get('getbyemail/:email')
  @ApiParam({name: 'email', required: true, description: 'User email'})
  @ApiOkResponse({description: 'Get User by Email', type: UserResponseDto, isArray: false})
  @ApiNoContentResponse({description: 'User not found', isArray: false})
  @ApiBadRequestResponse({description: 'Invalid Email', isArray: false})
  public async getbyEmail(@EmailParam('email') email: string): Promise<UserResponseDto> {
    const result = await this.coreService.getUserByEmail(email);

    if (!result) {
      throw new HttpException('User not found', HttpStatusCode.NoContent);
    }

    // plainToClass method is useful for converting from one JS type to another with Love...
    return plainToClass(UserResponseDto, result, {excludeExtraneousValues: true});
  }
}

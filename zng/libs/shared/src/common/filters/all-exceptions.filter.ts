/*
 * File Name   : all-exceptions.filter.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Catch, ArgumentsHost, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let res: any;
    if (this.isExceptionObject(exception)) {
      res = { name: exception.name, message: exception.message, stack: exception.stack };
    } else {
      res = JSON.stringify(exception);
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      isSuccess: false,
      path: request.url,
      message: exception instanceof HttpException ? exception.message : 'Internal Server Error',
    };

    if (exception instanceof HttpException) {
      this.logger.debug(`HttpStatusCode: ${httpStatus} ${request.url} - ${responseBody.message}`);
    } else {
      this.logger.error(`HttpStatusCode: ${httpStatus} ${request.url} - ${responseBody.message}`);
    }

    response.status(httpStatus).json(responseBody);
  }
}
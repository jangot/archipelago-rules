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
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttpException = exception instanceof HttpException;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpStatus = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const stack = !isProduction && !isHttpException && this.isExceptionObject(exception) ? exception.stack : undefined;

    const responseBody = {
      statusCode: httpStatus,
      message: isHttpException ? exception.message : 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      stack: stack,
    };

    if (isHttpException) {
      this.logger.log(`statusCode: ${httpStatus}, url: ${request.url}, message: ${responseBody.message}`);
    } else {
      this.logger.error(`statusCode: ${httpStatus}, url: ${request.url}, message: ${responseBody.message}`, stack);
    }

    response.status(httpStatus).json(responseBody);
  }
}

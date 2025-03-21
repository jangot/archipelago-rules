/*
 * File Name   : all-exceptions.filter.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Catch, ArgumentsHost, HttpStatus, HttpException, Logger, BadRequestException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  public catch(exception: unknown, host: ArgumentsHost) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttpException = exception instanceof HttpException;
    const isBadRequest = this.isBadRequestException(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpStatus = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const stack = !isProduction && !isHttpException && this.isExceptionObject(exception) ? exception.stack : undefined;

    const message = isBadRequest ? this.getBadRequestMessage(exception) : isHttpException ? exception.message : 'Internal Server Error';

    const responseBody = { statusCode: httpStatus, message: message, timestamp: new Date().toISOString(), path: request.url, stack: stack };

    if (isHttpException) {
      this.logger.log(`statusCode: ${httpStatus}, url: ${request.url}, message: ${responseBody.message}`);
    } else {
      this.logger.error(`statusCode: ${httpStatus}, url: ${request.url}, message: ${responseBody.message}`, stack);
    }

    response.status(httpStatus).json(responseBody);
  }

  private getBadRequestMessage(exception: BadRequestException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }

    const responseMessage = response['message'];
    if (typeof responseMessage === 'string') {
      return responseMessage;
    } else if (Array.isArray(responseMessage) && responseMessage.length > 0) {
      return responseMessage[0];
    }

    return 'Invalid Request';
  }

  private isBadRequestException(exception: unknown): exception is BadRequestException {
    return exception instanceof BadRequestException && exception.getStatus() === HttpStatus.BAD_REQUEST;
  }
}

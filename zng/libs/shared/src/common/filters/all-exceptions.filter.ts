/*
 * File Name   : all-exceptions.filter.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Catch, ArgumentsHost, HttpStatus, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (process.env.IS_LOCAL !== '1') {
        super.catch(exception, host);
    }
    else {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        let res: any;
        if (this.isExceptionObject(exception)) {
            res = {name: exception.name, message: exception.message, stack: exception.stack};
        } else {
            res = JSON.stringify(exception);
        }

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        isSuccess: 'false',
        timestamp: new Date().toISOString(),
        path: request.url,
        error: res,
        });
    }
  }
}
import { BaseExceptionFilter } from '@nestjs/core';
import { BaseDomainException } from '../exception/domain';
import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(BaseDomainException)
export class DomainExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DomainExceptionsFilter.name);

  // Moved Mapping into the Actual Exception itself. That made way more sense and made it easier to change
  // and keep track of.
  public catch(exception: BaseDomainException, host: ArgumentsHost) {
    const isProduction = process.env.NODE_ENV === 'production';
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorCode = exception.code;

    const stack = !isProduction && this.isExceptionObject(exception) ? exception.stack : undefined;
    const message = exception.message || 'Bad Request';
    const httpStatus = exception.httpStatus;

    const responseBody = {
      statusCode: httpStatus,
      errorCode,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      stack: stack,
    };

    // TODO: Should we choose what log level should be here? If so then based on what?
    // Putting error data object as first param will log it, while putting it as second param will not log it
    this.logger.warn({ stack, errorCode }, `statusCode: ${httpStatus}, url: ${request.url}, message: ${responseBody.message}`);

    response.status(httpStatus).json(responseBody);
  }
}

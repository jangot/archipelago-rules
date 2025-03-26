import { BaseExceptionFilter } from '@nestjs/core';
import { DomainExceptionCode, DomainServiceException } from '../exceptions/domain';
import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(DomainServiceException)
export class DomainExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DomainExceptionsFilter.name);

  public catch(exception: DomainServiceException, host: ArgumentsHost) {
    const isProduction = process.env.NODE_ENV === 'production';
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { errorCode } = exception;

    const stack = !isProduction && this.isExceptionObject(exception) ? exception.stack : undefined;
    const message = exception.message || 'Bad Request';
    const httpStatus = this.mapToHttpStatusCode(exception.errorCode);

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

  private mapToHttpStatusCode(errorCode?: DomainExceptionCode): number {
    switch (errorCode) {
      case DomainExceptionCode.EntityNotFound:
        return HttpStatus.NOT_FOUND;
      case DomainExceptionCode.UnathorizedRequest:
        return HttpStatus.UNAUTHORIZED;
      case DomainExceptionCode.MissingInput:
        return HttpStatus.BAD_REQUEST;
      case DomainExceptionCode.UserNotRegistered:
        return HttpStatus.NOT_FOUND;
      case DomainExceptionCode.LoginSessionNotInitiated:
        return HttpStatus.FORBIDDEN;
      case DomainExceptionCode.LoginSessionExpired:
        return HttpStatus.FORBIDDEN;
      case DomainExceptionCode.VerificationCodeMismatch:
        return HttpStatus.BAD_REQUEST;
      case DomainExceptionCode.UnableToGenerateLoginPayload:
        return HttpStatus.INTERNAL_SERVER_ERROR; // Should we also have 500s here?
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}

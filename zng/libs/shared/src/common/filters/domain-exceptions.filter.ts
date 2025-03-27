import { BaseExceptionFilter } from '@nestjs/core';
import { DomainExceptionCode, DomainServiceException } from '../exceptions/domain';
import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(DomainServiceException)
export class DomainExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DomainExceptionsFilter.name);

  // Static mapping of domain exception codes to HTTP status codes
  private static readonly HTTP_STATUS_MAP: Record<DomainExceptionCode, HttpStatus> = {
    [DomainExceptionCode.Undefined]: HttpStatus.BAD_REQUEST,
    [DomainExceptionCode.EntityNotFound]: HttpStatus.NOT_FOUND,
    [DomainExceptionCode.UnauthorizedRequest]: HttpStatus.UNAUTHORIZED,
    [DomainExceptionCode.MissingInput]: HttpStatus.BAD_REQUEST,
    [DomainExceptionCode.UserNotRegistered]: HttpStatus.NOT_FOUND,
    [DomainExceptionCode.LoginSessionNotInitiated]: HttpStatus.FORBIDDEN,
    [DomainExceptionCode.LoginSessionExpired]: HttpStatus.FORBIDDEN,
    [DomainExceptionCode.VerificationCodeMismatch]: HttpStatus.BAD_REQUEST,
    [DomainExceptionCode.UnableToGenerateLoginPayload]: HttpStatus.INTERNAL_SERVER_ERROR,
    [DomainExceptionCode.UnexpectedRegistrationStatus]: HttpStatus.INTERNAL_SERVER_ERROR,
    [DomainExceptionCode.ConfigurationVariableNotFound]: HttpStatus.INTERNAL_SERVER_ERROR,
  };

  public catch(exception: DomainServiceException, host: ArgumentsHost) {
    const isProduction = process.env.NODE_ENV === 'production';
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { errorCode } = exception;

    const stack = !isProduction && this.isExceptionObject(exception) ? exception.stack : undefined;
    const message = exception.message || 'Bad Request';
    const httpStatus = this.mapToHttpStatusCode(errorCode || DomainExceptionCode.Undefined);

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

  private mapToHttpStatusCode(errorCode: DomainExceptionCode): number {
    return DomainExceptionsFilter.HTTP_STATUS_MAP[errorCode] || HttpStatus.BAD_REQUEST;
  }
}

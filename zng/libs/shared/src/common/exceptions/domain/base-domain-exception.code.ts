import { HttpStatus } from '@nestjs/common';

export const BaseDomainExceptionCodes = {
  Undefined: 'undefined',
  EntityNotFound: 'entity_not_found',
  UnauthorizedRequest: 'unauthorized_request',
  MissingInput: 'missing_input',
  ConfigurationVariableNotFound: 'configuration_variable_not_found',
  EntityFailedToUpdate: 'entity_failed_to_update',
} as const;

// Type for the base exception codes
export type BaseDomainExceptionCode = typeof BaseDomainExceptionCodes[keyof typeof BaseDomainExceptionCodes];

// Interface for extending domain exception codes
export interface DomainExceptionCodeRegistry {
  readonly code: string;
  readonly namespace: string;
}

// Base class for domain exceptions with generic type parameter
export abstract class BaseDomainException<TCode extends string = BaseDomainExceptionCode> extends Error implements DomainExceptionCodeRegistry {
  constructor(
    public readonly code: TCode,
    public readonly namespace: string = 'base',
    public readonly httpStatus: number = HttpStatus.BAD_REQUEST,
    message?: string
  ) {
    super(message || `Domain Exception: ${code}`);
    this.name = this.constructor.name;
  }
} 

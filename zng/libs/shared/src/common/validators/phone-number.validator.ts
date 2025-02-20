/*
 * File Name   : phone-number.validator.ts
 * Author      : Michael LeDuc
 * Created Date: Thu Feb 20 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import phone from 'phone';

/**
 * Helper function that checks if a given value is a valid phone number.
 * For example, here we use a simple regex for US phone numbers.
 */
export function isValidPhoneNumber(value: string): boolean {
  // Adjust the regex to suit your phone number validation requirements

  const result = phone(value, { country: 'USA' });
  return result && result.isValid;
}

/**
 * The custom validator constraint class that implements the validation logic.
 */
@ValidatorConstraint({ async: false })
export class IsValidPhoneNumberConstraint implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(value: any, _args: ValidationArguments): boolean {
    return isValidPhoneNumber(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments): string {
    return 'The phone number ($value) is not valid!';
  }
}

/**
 * The custom decorator. When applied to a property, it registers the
 * IsValidPhoneNumberConstraint validator for that property.
 */
export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneNumberConstraint,
    });
  };
}

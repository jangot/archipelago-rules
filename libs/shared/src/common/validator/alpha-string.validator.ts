import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Checks if the string contains only alphabetic characters (A-Z, a-z).
 * Returns true if the value is a string and contains only letters.
 */
@ValidatorConstraint({ async: false })
export class IsAlphaStringConstraint implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(value: any, _args: ValidationArguments): boolean {
    return typeof value === 'string' && /^[A-Za-z]+$/.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `The property "${args.property}" must contain only letters (A-Z, a-z).`;
  }
}

/**
 * Custom decorator to validate that a string contains only letters (A-Z, a-z).
 * @param validationOptions Optional validation options
 */
export function IsAlphaString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAlphaStringConstraint,
    });
  };
}

import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Custom validator decorator that ensures the array contains all required values
 */
export function ContainsRequiredValues(requiredValues: any[], validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'containsRequiredValues',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) {
            return false;
          }
          return requiredValues.every(requiredValue => value.includes(requiredValue));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain all required values: ${requiredValues.join(', ')}`;
        },
      },
    });
  };
}

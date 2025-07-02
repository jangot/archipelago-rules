import { 
  registerDecorator, 
  ValidationOptions, 
  ValidatorConstraint, 
  ValidatorConstraintInterface, 
  ValidationArguments, 
} from 'class-validator';
import { parse, isValid, format } from 'date-fns';

// We could enhance this to support more formats, but for now this is sufficient.
@ValidatorConstraint({ async: false })
export class IsValidDateStringConstraint implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(dateStr: any, _args: ValidationArguments): boolean {
    if (typeof dateStr !== 'string') return false;

    // Parse the date string with the expected format
    const parsedDate = parse(dateStr, 'MM/dd/yyyy', new Date());

    // Check if the parsed date is valid
    if (!isValid(parsedDate)) return false;

    // Re-format the parsed date and compare with the original string
    const reformatted = format(parsedDate, 'MM/dd/yyyy');
    return reformatted === dateStr;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments): string {
    return 'Date ($value) must be a valid date string in the format MM/dd/yyyy';
  }
}

export function IsValidDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDateStringConstraint,
    });
  };
}

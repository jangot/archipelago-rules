import { ValueTransformer } from 'typeorm';
import { parse, format } from 'date-fns';

export const DateTransformer: ValueTransformer = {
  // "to" is called when saving the entity value to the database.
  to: (value: string | Date): Date | null => {
    if (!value) return null;
    // If value is a string, parse it using date-fns.
    if (typeof value === 'string') {
      // parse expects the string, the format, and a reference date.
      const result = parse(value, 'MM/dd/yyyy', new Date());

      return result;
    }
    // If already a Date, return it as is.
    return value;
  },
  // "from" is called when retrieving the value from the database.
  from: (value: Date | null): string | null => {
    if (!value) return null;
    // Format the Date into the desired "MM/dd/yyyy" string.
    return format(value, 'MM/dd/yyyy');
  },
};

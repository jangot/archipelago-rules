import {Param, PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

import { isEmail } from 'class-validator';

@Injectable()
export class ParseEmailPipe implements PipeTransform {
  transform(value: any) {
    const isValid = isEmail(value);
    if (!isValid) {
      throw new BadRequestException('Validation failed (email is expected)');
    }
    return value;
  }
}

export const EmailParam = (name: string) => Param(name, new ParseEmailPipe());
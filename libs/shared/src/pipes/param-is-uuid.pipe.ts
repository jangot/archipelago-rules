import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { validate } from 'uuid';

@Injectable()
export class ParamIsUuidPipe implements PipeTransform<string, string> {
  constructor(private readonly message = 'Param is not UUID') {}

  public transform(value: string): string {
    if (validate(value)) {
      return value;
    }

    throw new BadRequestException(this.message);
  }
}

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidateOptionalQueryParamsPipe implements PipeTransform {
  constructor(private readonly optionalParameters: string[]) {}

  public transform(value: any) {
    // Count how many of the optional parameters exist in the request
    const presentParams = this.optionalParameters.filter((param) => value[param] !== undefined);

    if (presentParams.length === 0) {
      throw new BadRequestException(`Exactly one of the following query parameters must be provided: ${this.optionalParameters.join(', ')}.`);
    }

    if (presentParams.length > 1) {
      throw new BadRequestException(
        `Only one of the following query parameters is allowed at a time: ${this.optionalParameters.join(', ')}. Found: ${presentParams.join(', ')}`
      );
    }

    return value; // Allow request to proceed if exactly one parameter is present
  }
}

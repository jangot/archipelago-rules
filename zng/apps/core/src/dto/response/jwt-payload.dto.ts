import { RegistrationStatus } from '@library/entity/enum';

export class JwtPayloadDto {
  sub: string; // userId
  registration: RegistrationStatus; // registration status of a user
}

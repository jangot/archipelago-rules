import { Injectable, Logger } from '@nestjs/common';
import { IDomainServices } from '../domain/idomain.services';
import { UserResponseDto } from '../dto';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { EntityNotFoundException } from '@library/shared/common/exceptions/domain';

@Injectable()
export class UsersService {
  private readonly logger: Logger = new Logger(UsersService.name);
  constructor(private readonly domainServices: IDomainServices) {}

  @MapToDto(UserResponseDto)
  public async getUserDetails(userId: string): Promise<UserResponseDto> {
    const result = await this.domainServices.userServices.getUserById(userId);
    if (!result) {
      this.logger.error(`getUserDetails: User not found for ID: ${userId}`);
      throw new EntityNotFoundException('User not found');
    }
    return result as unknown as UserResponseDto;
  }
}

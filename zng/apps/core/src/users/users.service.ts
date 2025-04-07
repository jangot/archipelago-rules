import { Injectable, Logger } from '@nestjs/common';
import { IDomainServices } from '../domain/idomain.services';
import { UserDetailResponseDTO, UserDetailsUpdateRequestDto, UserDetailsUpdateResponseDto } from '../dto';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { EntityFailedToBeUpdatedException, EntityNotFoundException } from '@library/shared/common/exceptions/domain';

@Injectable()
export class UsersService {
  private readonly logger: Logger = new Logger(UsersService.name);
  constructor(private readonly domainServices: IDomainServices) {}

  @MapToDto(UserDetailResponseDTO)
  public async getUserDetails(userId: string): Promise<UserDetailResponseDTO> {
    const result = await this.domainServices.userServices.getUserById(userId);
    if (!result) {
      this.logger.error(`getUserDetails: User not found for ID: ${userId}`);
      throw new EntityNotFoundException('User not found');
    }
    return result as unknown as UserDetailResponseDTO;
  }

  @MapToDto(UserDetailsUpdateResponseDto)
  public async updateDetails(userId: string, updates: UserDetailsUpdateRequestDto): Promise<UserDetailsUpdateResponseDto> {
    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      this.logger.error(`updateDetails: User not found for ID: ${userId}`);
      throw new EntityNotFoundException('User not found');
    }
    const updatePayload = { ...user, ...updates };

    const updateResult = await this.domainServices.userServices.updateUser(updatePayload);

    if (!updateResult) {
      this.logger.error(`updateDetails: Could not apply updates for ID: ${userId}`, updatePayload);
      throw new EntityFailedToBeUpdatedException('Could not update the User');
    }

    const updatedUser = await this.domainServices.userServices.getUserById(userId);
    return updatedUser as unknown as UserDetailsUpdateResponseDto;
  }
}

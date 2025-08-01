import { ContactType } from '@library/entity/enum';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { ApplicationUser } from '@library/shared/domain/entity';
import { IGetUserDetailByIdResult, getUserDetailById } from '@library/shared/infrastructure/data/generated/get-user-detail.queries';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository extends RepositoryBase<ApplicationUser> {
  private readonly logger: Logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(ApplicationUser)
    protected readonly repository: Repository<ApplicationUser>
  ) {
    super(repository, ApplicationUser);
  }

  public async getUserByContact(contact: string, type: string): Promise<ApplicationUser | null> {
    this.logger.debug(`getUserByContact: Getting User by ${type} Contact: ${contact}`);

    switch (type) {
      case ContactType.EMAIL:
        return this.repository.findOneBy({ email: contact });
      case ContactType.PHONE_NUMBER:
        return this.repository.findOneBy({ phoneNumber: contact });
      case ContactType.PENDING_EMAIL:
        return this.repository.findOneBy({ pendingEmail: contact });
      case ContactType.PENDING_PHONE_NUMBER:
        return this.repository.findOneBy({ pendingPhoneNumber: contact });
      default:
        break;
    }

    return null;
  }

  // Example usage of a pgtyped Query
  // The base repository handles converting things properly
  public async getUserDetailById(userId: string): Promise<IGetUserDetailByIdResult | null> {
    const result = await this.runSqlQuerySingle({ userId }, getUserDetailById);
    return result;
  }
}

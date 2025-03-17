import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactType } from '@library/entity/enum';
import { getUserDetailById, IGetUserDetailByIdResult } from '../sql_generated/get-user-detail.queries';
import { ApplicationUser } from '../../domain/entities';
import { IUserRepository } from '../../shared/interfaces/repositories';
import { IApplicationUser } from '@library/entity/interface';

@Injectable()
export class UserRepository extends RepositoryBase<ApplicationUser> implements IUserRepository {
  private readonly logger: Logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(ApplicationUser)
    protected readonly repository: Repository<ApplicationUser>
  ) {
    super(repository, ApplicationUser);
  }

  public async getUserById(id: string): Promise<IApplicationUser | null> {
    this.logger.debug(`getUserById: Getting User by Id: ${id}`);
    return await this.repository.findOneBy({ id });
  }

  public async getUserByContact(contact: string, type: ContactType): Promise<IApplicationUser | null> {
    this.logger.debug(`getUserByContact: Getting User by ${type} Contact: ${contact}`);

    switch (type) {
      case ContactType.EMAIL:
        return await this.repository.findOneBy({ email: contact });
      case ContactType.PHONE_NUMBER:
        return await this.repository.findOneBy({ phoneNumber: contact });
      case ContactType.PENDING_EMAIL:
        return await this.repository.findOneBy({ pendingEmail: contact });
      case ContactType.PENDING_PHONE_NUMBER:
        return await this.repository.findOneBy({ pendingPhoneNumber: contact });
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

import { IUserRepository } from '../interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ApplicationUser } from '../../entity';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactType } from '@library/entity/enum';
import { getUserDetailById, IGetUserDetailByIdResult } from '../../sql_generated/get-user-detail.queries';

@Injectable()
export class UserRepository extends RepositoryBase<ApplicationUser> implements IUserRepository {
  private readonly logger: Logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(ApplicationUser)
    protected readonly repository: Repository<ApplicationUser>
  ) {
    super(repository, ApplicationUser);
  }

  public async getUserById(id: string): Promise<ApplicationUser | null> {
    this.logger.debug(`getUserById: Getting User by Id: ${id}`);
    return await this.repository.findOneBy({ id });
  }

  public async getUserByContact(contact: string, type: ContactType): Promise<ApplicationUser | null> {
    this.logger.debug(`getUserByContact: Getting User by ${type} Contact: ${contact}`);

    switch (type) {
      case ContactType.EMAIL:
        return await this.repository.findOneBy({ email: contact });
      case ContactType.PHONE_NUMBER:
        return await this.repository.findOneBy({ phoneNumber: contact });
      default:
        break;
    }

    return null;
  }

  public async getUserDetailById(userId: string): Promise<IGetUserDetailByIdResult | null> {
    // Need this for pgtyped usage!
    const poolAdapter = this.getIDatabaseConnection();

    const result = await getUserDetailById.run({ userId }, poolAdapter);
    return result.length === 0 ? null : result[0];
  }
}

import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { IUserRegistrationRepository } from '../interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRegistration } from '../../entity';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class UserRegistrationRepository
  extends RepositoryBase<UserRegistration>
  implements IUserRegistrationRepository
{
  private readonly logger: Logger = new Logger(UserRegistrationRepository.name);

  constructor(@InjectRepository(UserRegistration) protected readonly repository: Repository<UserRegistration>) {
    super(repository, UserRegistration);
  }

  public async getByUserId(userId: string): Promise<UserRegistration | null> {
    return await this.repository.findOneBy({ userId });
  }
}

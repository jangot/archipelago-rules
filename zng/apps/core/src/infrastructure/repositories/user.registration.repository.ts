import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserRegistration } from '../../domain/entities';
import { IUserRegistrationRepository } from '../../shared/interfaces/repositories';
import { IUserRegistration } from '@library/entity/interface';

@Injectable()
export class UserRegistrationRepository extends RepositoryBase<UserRegistration> implements IUserRegistrationRepository {
  private readonly logger: Logger = new Logger(UserRegistrationRepository.name);

  constructor(@InjectRepository(UserRegistration) protected readonly repository: Repository<UserRegistration>) {
    super(repository, UserRegistration);
  }

  public async getByUserId(userId: string): Promise<IUserRegistration | null> {
    return await this.repository.findOneBy({ userId });
  }
}

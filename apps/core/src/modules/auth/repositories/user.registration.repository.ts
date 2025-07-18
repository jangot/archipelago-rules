import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { UserRegistration } from '@library/shared/domain/entity/user.registration.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserRegistrationRepository extends RepositoryBase<UserRegistration> {
  private readonly logger: Logger = new Logger(UserRegistrationRepository.name);

  constructor(
    @InjectRepository(UserRegistration)
    protected readonly repository: Repository<UserRegistration>
  ) {
    super(repository, UserRegistration);
  }

  public async getByUserId(userId: string): Promise<UserRegistration | null> {
    return this.repository.findOneBy({ userId });
  }
}

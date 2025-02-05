import { IUserRepository } from '../interfaces';
import { Injectable } from '@nestjs/common';
import { RepositoryBase } from '../common/base.repository';
import { ApplicationUserEntity } from '../../entity';
import { IApplicationUser } from '@library/entity/interface';

@Injectable()
export class UserRepository extends RepositoryBase<ApplicationUserEntity> implements IUserRepository<IApplicationUser> {
  // Implementation of IUserRepository in TypeORM goes here
  public async getByEmail(email: string): Promise<IApplicationUser | null> {
    return await this.repository.findOneBy({ email });
  }
}

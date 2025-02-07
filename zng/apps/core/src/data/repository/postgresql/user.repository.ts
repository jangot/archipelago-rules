import { IUserRepository } from '../interfaces';
import { Inject, Injectable } from '@nestjs/common';
import { RepositoryBase } from '../common/base.repository';
import { ApplicationUser } from '../../entity';
import { IApplicationUser } from '@library/entity/interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositoryKey } from '../common';

@Injectable()
export class UserRepository extends RepositoryBase<ApplicationUser> implements IUserRepository<IApplicationUser> {
  constructor(@Inject(RepositoryKey.USER) protected readonly repository: Repository<ApplicationUser>) {
    super(repository);
  }

  public async getByEmail(email: string): Promise<IApplicationUser | null> {
    return await this.repository.findOneBy({ email });
  }
}

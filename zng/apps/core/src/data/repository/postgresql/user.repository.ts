import { IUserRepository } from '../interfaces';
import { Injectable } from '@nestjs/common';
import { ApplicationUser } from '../../entity';
import { IApplicationUser } from '@library/entity/interface';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository extends RepositoryBase<ApplicationUser> implements IUserRepository {
  constructor(@InjectRepository(ApplicationUser) protected readonly repository: Repository<ApplicationUser>) {
    super(repository);
  }

  public async getByEmail(email: string): Promise<IApplicationUser | null> {
    return await this.repository.findOneBy({ email });
  }

  public async getByPhone(phone: string): Promise<ApplicationUser | null> {
    return await this.repository.findOneBy({ phoneNumber: phone });
  }
}

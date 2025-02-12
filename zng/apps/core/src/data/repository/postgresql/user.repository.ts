import { IUserRepository } from '../interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ApplicationUser } from '../../entity';
import { IApplicationUser } from '@library/entity/interface';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository extends RepositoryBase<ApplicationUser> implements IUserRepository {
  private readonly logger: Logger = new Logger(UserRepository.name);
  
  constructor(
    @InjectRepository(ApplicationUser) 
    protected readonly repository: Repository<ApplicationUser>
  ) {
    super(repository);
  }

  public async getByEmail(email: string): Promise<IApplicationUser | null> {
    this.logger.debug(`getByEmail: ${email}`);
    return await this.repository.findOneBy({ email });
  }

  public async getByPhone(phone: string): Promise<ApplicationUser | null> {
    this.logger.debug(`getByPhone: ${phone}`);
    return await this.repository.findOneBy({ phoneNumber: phone });
  }
}

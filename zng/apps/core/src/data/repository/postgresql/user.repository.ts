import { IUserRepository } from '../interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ApplicationUser } from '../../entity';
import { IApplicationUser } from '@library/entity/interface';
import { FindOptionsWhere, Repository } from 'typeorm';
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
}

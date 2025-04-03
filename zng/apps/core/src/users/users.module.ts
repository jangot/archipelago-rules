import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DomainModule } from '../domain/domain.module';

@Module({
  imports: [DomainModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

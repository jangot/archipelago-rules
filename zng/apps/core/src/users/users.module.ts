import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DataModule } from '../data';
import { UserDomainService } from '../domain/services/user.domain.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [DataModule, JwtModule],
  controllers: [UsersController],
  providers: [UsersService, UserDomainService],
  exports: [UsersService, UserDomainService],
})
export class UsersModule {}

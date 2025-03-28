import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DataModule } from '../data';
import { UserDomainService } from '../domain/services/user.domain.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DataModule, JwtModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService, UserDomainService],
  exports: [UsersService, UserDomainService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { UsersManagementService } from './users-management.service';
import { UsersManagementController } from './users-management.controller';
import { DataModule } from '../data';
import { UserDomainService } from '../domain/services/user.domain.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DataModule, JwtModule, ConfigModule],
  controllers: [UsersManagementController],
  providers: [UsersManagementService, UserDomainService],
  exports: [UsersManagementService, UserDomainService],
})
export class UsersManagementModule {}

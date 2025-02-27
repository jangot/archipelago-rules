import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CustomAuthStrategies } from './strategies';
import { CustomAuthGuards } from './guards';
import { UsersModule } from '../users';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '../data';

@Module({
  imports: [UsersModule, ConfigModule, DataModule],
  controllers: [AuthController],
  providers: [AuthService, ...CustomAuthStrategies, ...CustomAuthGuards],
})
export class AuthModule {}

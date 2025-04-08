import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { DomainModule } from '@core/domain/domain.module';

@Module({
  imports: [JwtModule, ConfigModule, DomainModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

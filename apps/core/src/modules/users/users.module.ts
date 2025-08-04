import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { DomainModule } from '@core/modules/domain/domain.module';
import { TestEventController } from '@core/local-dev/test-event.controller';

@Module({
  imports: [JwtModule, ConfigModule, DomainModule],
  controllers: [UsersController, TestEventController],
  providers: [UsersService],
})
export class UsersModule {}

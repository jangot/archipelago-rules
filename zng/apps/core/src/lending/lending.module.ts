import { DomainModule } from '@core/domain/domain.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BillersController } from './billers.controller';
import { LoansController } from './loans.controller';
import { ScheduleController } from './schedule.controller';
import { BillersService } from './billers.service';
import { LoansService } from './loans.service';
import { ScheduleService } from '../../../../libs/shared/src/services/schedule.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [JwtModule, ConfigModule, DomainModule, CqrsModule],
  controllers: [BillersController, LoansController, ScheduleController],
  providers: [Logger, BillersService, LoansService, ScheduleService],
})
export class LendingModule {}

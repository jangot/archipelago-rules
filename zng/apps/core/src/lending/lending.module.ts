import { DomainModule } from '@core/domain/domain.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BillersController } from './billers.controller';
import { LoansController } from './loans.controller';
import { ScheduleController } from './schedule.controller';
import { BillersService } from './billers.service';
import { LoansService } from './loans.service';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [JwtModule, ConfigModule, DomainModule],
  controllers: [BillersController, LoansController, ScheduleController],
  providers: [BillersService, LoansService, ScheduleService],
})
export class LendingModule {}

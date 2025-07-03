import { DomainModule } from '@core/modules/domain/domain.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BillersController } from './billers.controller';
import { LoansController } from './loans.controller';
import { ScheduleController } from './schedule.controller';
import { BillersService } from './billers.service';
import { LoansService } from './loans.service';
import { CqrsModule } from '@nestjs/cqrs';
import { ILoanStateManagers, ILoanStateManagersFactory } from './interfaces';
import { LoanStateManagers } from './loan-state-managers/loan-state-managers';
import { ScheduleService } from '@library/shared/services';
import { LoanStateManagersFactory } from './loan-state-manager-factory';

@Module({
  imports: [JwtModule, ConfigModule, DomainModule, CqrsModule],
  controllers: [BillersController, LoansController, ScheduleController],
  providers: [
    Logger, BillersService, LoansService, ScheduleService, 
    { provide: ILoanStateManagers, useClass: LoanStateManagers },
    { provide: ILoanStateManagersFactory, useClass: LoanStateManagersFactory },
  ],
})
export class LendingModule {}

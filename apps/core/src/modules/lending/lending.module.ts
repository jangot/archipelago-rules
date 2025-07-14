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
import { LoanStateManagers, LOAN_STATE_MANAGERS } from './loan-state-managers';
import { LoanStateManagersFactory } from './loan-state-manager-factory';
import { ScheduleService } from '@library/shared/service';
import { LoanApplicationsController } from '@core/modules/lending/loan.applications.controller';
import { LoanApplicationsService } from '@core/modules/lending/loan.applications.service';
import { DataModule } from '@core/modules/data';

@Module({
  imports: [JwtModule, ConfigModule, DomainModule, CqrsModule, DataModule],
  controllers: [BillersController, LoansController, LoanApplicationsController, ScheduleController],
  providers: [
    Logger, 
    BillersService, 
    LoansService, 
    LoanApplicationsService,
    ScheduleService,
    // Individual state managers (spread from array)
    ...LOAN_STATE_MANAGERS,
    // State managers container and factory
    { provide: ILoanStateManagers, useClass: LoanStateManagers },
    { provide: ILoanStateManagersFactory, useClass: LoanStateManagersFactory },
  ],
})
export class LendingModule {}

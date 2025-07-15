import { DataModule } from '@core/modules/data';
import { DomainModule } from '@core/modules/domain/domain.module';
import { LoanApplicationsController } from '@core/modules/lending/loan-applications.controller';
import { LoanApplicationsService } from '@core/modules/lending/loan-applications.service';
import { ScheduleService } from '@library/shared/service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { BillersController } from './billers.controller';
import { BillersService } from './billers.service';
import { ILoanStateManagers, ILoanStateManagersFactory } from './interfaces';
import { LoanStateManagersFactory } from './loan-state-manager-factory';
import { LOAN_STATE_MANAGERS, LoanStateManagers } from './loan-state-managers';
import { LOAN_STATE_STRATEGIES } from './loan-state-managers/strategy';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { ScheduleController } from './schedule.controller';

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
    // Loan state strategies
    ...LOAN_STATE_STRATEGIES,
    // State managers container and factory
    { provide: ILoanStateManagers, useClass: LoanStateManagers },
    { provide: ILoanStateManagersFactory, useClass: LoanStateManagersFactory },
  ],
})
export class LendingModule {}

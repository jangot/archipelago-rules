import { LoanCreateCommandHandler } from './loan.create.command';
import { LoanProposeCommandHandler } from './loan.propose.command';

export const LendingCommandHandlers = [LoanCreateCommandHandler, LoanProposeCommandHandler];

export * from './lending.commands';

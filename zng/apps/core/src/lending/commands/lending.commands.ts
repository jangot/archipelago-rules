import { LendingBasePayload, LoanCreatePayload } from './lending.commands.payload';

export class LendingBaseCommand {
  constructor(public readonly payload: LendingBasePayload) {}
}

export class LoanCreateCommand {
  constructor(public readonly payload: LoanCreatePayload) {}
}

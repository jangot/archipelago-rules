import { LendingBasePayload, LoanBindPayload, LoanCreatePayload, LoanProposePayload } from './lending.commands.payload';

export class LendingBaseCommand {
  constructor(public readonly payload: LendingBasePayload) {}
}

export class LoanCreateCommand {
  constructor(public readonly payload: LoanCreatePayload) {}
}

export class LoanProposeCommand {
  constructor(public readonly payload: LoanProposePayload) {}
}

export class LoanBindCommand {
  constructor(public readonly payload: LoanBindPayload) {}
}

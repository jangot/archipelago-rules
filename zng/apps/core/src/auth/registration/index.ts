import { OrganicRegistrationFlow } from './registration-flow.organic';
import { SandboxRegistrationFlow } from './registration-flow.sandbox';

export * from './stage-transition.interface';
export * from './registration-flow.base';
export * from './registration-flow.organic';
export * from './registration-flow.sandbox';

export const Registrators = [OrganicRegistrationFlow, SandboxRegistrationFlow];

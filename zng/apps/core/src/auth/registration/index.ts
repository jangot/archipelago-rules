import { OrganicRegistrator } from './registrator.organic';
import { SandboxRegistrator } from './registrator.sandbox';

export * from './stage-transition.interface';
export * from './registrator.base';
export * from './registrator.organic';
export * from './registrator.sandbox';

export const Registrators = [OrganicRegistrator, SandboxRegistrator];

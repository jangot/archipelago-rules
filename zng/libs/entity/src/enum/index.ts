import {
  OrganicEmailRegistrationStage,
  OrganicPhoneRegistrationStage,
  SandboxBypassRegistrationStage,
} from './registration.stage';

export * from './contact.type';
export * from './login.type';
export * from './login.status';
export * from './jwt.type';

// Registration
export * from './registration.type';
export * from './registration.stage';

export type RegistrationStage =
  | OrganicEmailRegistrationStage
  | OrganicPhoneRegistrationStage
  | SandboxBypassRegistrationStage;

export const RegistrationCompletedStates = [
  OrganicEmailRegistrationStage.Verified,
  OrganicPhoneRegistrationStage.Verified,
  SandboxBypassRegistrationStage.Verified,
];
//

import { OrganicRegistrationRequestDto } from './registration-organic.request.dto';
import { SandboxRegistrationRequestDto } from './registration-sandbox.request.dto';

export * from './user-create-request.dto';
export * from './user-update-request.dto';
export * from './password-verification.request.dto';
export * from './user-register-request.dto';
export * from './auth-secret-create-request.dto';

// Registration
export * from './registration-organic.request.dto';
export * from './registration-sandbox.request.dto';

export type RegistrationDto = OrganicRegistrationRequestDto | SandboxRegistrationRequestDto;
//

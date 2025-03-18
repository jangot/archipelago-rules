import { LoginDomainService } from './services/login.domain.service';
import { UserDomainService } from './services/user.domain.service';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
  readonly loginServices: LoginDomainService;
}

import { UserDomainService } from './services/user.domain.service';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
}

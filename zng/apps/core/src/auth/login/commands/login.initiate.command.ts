import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginInitiateCommand } from './login.commands';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { UserLoginResponseDTO } from 'apps/core/src/dto/response/user-login-response.dto';
import { LoginLogic } from '../login.logic';
import { EntityNotFoundException, MissingInputException, UserNotRegisteredException } from '@library/shared/common/exceptions/domain';

@CommandHandler(LoginInitiateCommand)
export class LoginInitiateCommandHandler extends LoginBaseCommandHandler<LoginInitiateCommand> implements ICommandHandler<LoginInitiateCommand> {
  public async execute(command: LoginInitiateCommand): Promise<UserLoginResponseDTO> {
    const {
      payload: { contact, contactType },
    } = command;

    // Either userId or contact must be provided as well as Command execution should be provided with contact type by caller
    if (!contact || !contactType) {
      this.logger.error('LoginInitiateCommand: No contact or contact type provided');
      throw new MissingInputException('No contact or contact type provided');
    }

    const user = await this.domainServices.userServices.getUserByContact(contact, contactType);

    if (!user) {
      this.logger.warn('LoginInitiateCommand: No user found');
      throw new EntityNotFoundException('No user found');
    }

    const { registrationStatus } = user;
    if (!LoginLogic.isUserRegistered(contactType, registrationStatus)) {
      this.logger.warn('LoginInitiateCommand: User is not registered to Log In');
      throw new UserNotRegisteredException('User is not registered to log in');
    }

    const { code, expiresAt } = this.domainServices.userServices.generateCode();

    user.secret = code;
    user.secretExpiresAt = expiresAt;

    await this.domainServices.userServices.updateUser(user);

    // TODO: Send the code to the user
    //this.sendEvent()

    return { userId: user.id, verificationCode: code };
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { LoginVerifyCommand } from './login.commands';
import { UserLoginPayloadDto } from 'apps/core/src/dto/response/user-login-payload.dto';
import { ContactType } from '@library/entity/enum';
import { generateCRC32String } from '@library/shared/common/helpers/crc32.helpers';
import { LoginLogic } from '../login.logic';

@CommandHandler(LoginVerifyCommand)
export class LoginVerifyCommandHandler extends LoginBaseCommandHandler<LoginVerifyCommand> implements ICommandHandler<LoginVerifyCommand> {
  public async execute(command: LoginVerifyCommand): Promise<UserLoginPayloadDto> {
    const {
      payload: { userId, contact, contactType, verificationCode },
    } = command;

    //TODO: This should be refactored as it is the same code as in the LoginInitiateCommandHandler

    // Either userId or contact must be provided as well as Command execution should be provided with contact type by caller
    if (!userId && !contact) {
      this.logger.error('LoginInitiateCommand: No userId or contact provided');
      throw new Error('No userId or contact provided');
    }

    const user = userId
      ? await this.domainServices.userServices.getUserById(userId)
      : contact && contactType
        ? await this.domainServices.userServices.getUserByContact(contact, contactType)
        : null;

    if (!user) {
      this.logger.warn('LoginInitiateCommand: No user found');
      throw new Error('No user found');
    }

    const { registrationStatus } = user;
    if (!LoginLogic.isUserRegistered(user.contactType, registrationStatus)) {
      this.logger.warn('LoginInitiateCommand: User is not registered to Log In');
      throw new Error('User is not registered to log in');
    }

    const loginType = this.getLoginTypeByContactType(contactType || ContactType.EMAIL);

    const { secret, secretExpiresAt } = user;

    if (!secret) {
      this.logger.warn('LoginInitiateCommand: No secret found');
      throw new Error('Login session is not initiated');
    }

    if (secretExpiresAt && secretExpiresAt < new Date()) {
      this.logger.warn('LoginInitiateCommand: Secret expired');
      throw new Error('Login session is expired');
    }

    if (secret !== verificationCode) {
      this.logger.warn('LoginInitiateCommand: Verification code mismatch');
      throw new Error('Verification code mismatch');
    }

    const result = await this.generateLoginPayload(user.id, user.onboardStatus || '');

    user.secret = null;
    user.secretExpiresAt = null;

    const { accessToken, refreshToken, refreshTokenExpiresIn } = result;
    if (!accessToken || !refreshToken || !refreshTokenExpiresIn) {
      this.logger.error(`LoginVerifyCommand: Access token, Refresh token or its expiration time is not generated for user ${userId}`);
      throw new Error('Access token, Refresh token or its expiration time is not generated');
    }
    const hashedSecret = generateCRC32String(refreshToken);
    const hashedSessionId = generateCRC32String(accessToken);
    const newLogin = {
      loginType: loginType!,
      userId: user.id,
      updatedAt: new Date(),
      secret: hashedSecret,
      secretExpiresAt: refreshTokenExpiresIn,
      sessionId: hashedSessionId,
    };

    await this.domainServices.userServices.updateEntities([
      this.domainServices.userServices.updateUser(user),
      // IF we do not want create new Login on each verified login session - we should use 'createOrUpdateLogin' instead
      this.domainServices.userServices.createLogin(newLogin, false),
    ]);

    // TODO: publish event
    // this.eventBus.publish()

    return result;
  }
}

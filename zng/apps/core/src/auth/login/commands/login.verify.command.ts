import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { LoginVerifyCommand } from './login.commands';
import { UserLoginPayloadDto } from 'apps/core/src/dto/response/user-login-payload.dto';
import { ContactType } from '@library/entity/enum';
import { generateCRC32String } from '@library/shared/common/helpers/crc32.helpers';
import { LoginLogic } from '../login.logic';
import { EntityNotFoundException, LoginSessionExpiredException, LoginSessionNotInitiatedException, MissingInputException, UnableToGenerateLoginPayloadException, UserNotRegisteredException, VerificationCodeMismatchException } from '@library/shared/common/exceptions/domain';

@CommandHandler(LoginVerifyCommand)
export class LoginVerifyCommandHandler extends LoginBaseCommandHandler<LoginVerifyCommand> implements ICommandHandler<LoginVerifyCommand> {
  public async execute(command: LoginVerifyCommand): Promise<UserLoginPayloadDto> {
    const { payload: { userId, contact, contactType, verificationCode } } = command;

    // Either userId or contact must be provided as well as Command execution should be provided with contact type by caller
    if (!userId && !contact) {
      this.logger.error(`LoginVerifyCommand: No userId or contact provided for ${contactType}: ${contact}`);
      throw new MissingInputException('No userId or contact provided');
    }

    const user = userId
      ? await this.domainServices.userServices.getUserById(userId)
      : contact && contactType
        ? await this.domainServices.userServices.getUserByContact(contact, contactType)
        : null;

    if (!user) {
      this.logger.warn(`LoginVerifyCommand: No user found for ${contactType}: ${contact}`);
      throw new EntityNotFoundException('No user found');
    }

    const { registrationStatus } = user;
    if (!LoginLogic.isUserRegistered(contactType || ContactType.UNDEFINED, registrationStatus)) {
      this.logger.warn(`LoginVerifyCommand: User ${user.id} is not registered to Log In`);
      throw new UserNotRegisteredException('User is not registered to log in');
    }

    const loginType = this.getLoginTypeByContactType(contactType || ContactType.UNDEFINED);

    const { secret, secretExpiresAt } = user;

    if (!secret) {
      this.logger.warn(`LoginVerifyCommand: No secret found for user ${user.id}`);
      throw new LoginSessionNotInitiatedException('Login session is not initiated');
    }

    if (secretExpiresAt && secretExpiresAt < new Date()) {
      this.logger.warn(`LoginVerifyCommand: Secret expired for user ${user.id}`);
      throw new LoginSessionExpiredException('Login session is expired');
    }

    if (secret !== verificationCode) {
      this.logger.warn(`LoginVerifyCommand: Verification code mismatch for user ${user.id}`);
      throw new VerificationCodeMismatchException('Verification code mismatch');
    }

    const result = await this.generateLoginPayload(user.id, user.onboardStatus || '');

    user.secret = null;
    user.secretExpiresAt = null;

    const { accessToken, refreshToken, refreshTokenExpiresIn } = result;
    if (!accessToken || !refreshToken || !refreshTokenExpiresIn) {
      this.logger.error(`LoginVerifyCommand: Access token, Refresh token or its expiration time is not generated for user ${user.id}`);
      throw new UnableToGenerateLoginPayloadException('Access token, Refresh token or its expiration time is not generated');
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

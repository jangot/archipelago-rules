import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exception/domain';
import { generateCRC32String } from '@library/shared/common/helper/crc32.helpers';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserLoginPayloadDto } from '../../dto/response/user-login-payload.dto';
import { LoginSessionExpiredException, LoginSessionNotInitiatedException, UnableToGenerateLoginPayloadException, VerificationCodeMismatchException } from '../../exceptions/auth-domain.exceptions';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { LoginVerifyCommand } from './login.commands';

@CommandHandler(LoginVerifyCommand)
export class LoginVerifyCommandHandler extends LoginBaseCommandHandler<LoginVerifyCommand> implements ICommandHandler<LoginVerifyCommand> {
  public async execute(command: LoginVerifyCommand): Promise<UserLoginPayloadDto> {
    const { payload: { userId, verificationCode } } = command;

    // userId must be provided
    if (!userId) {
      this.logger.error('LoginVerifyCommand: No userId provided');
      throw new MissingInputException('No userId provided');
    }

    const user = await this.domainServices.userServices.getUserById(userId);

    if (!user) {
      this.logger.warn(`LoginVerifyCommand: No user found for ${userId}`);
      throw new EntityNotFoundException('No user found');
    }

    const { secret, secretExpiresAt, verificationType } = user;

    if (!secret || !verificationType) {
      this.logger.warn(`LoginVerifyCommand: No intiated login found for user ${user.id}`);
      throw new LoginSessionNotInitiatedException('Login session is not initiated');
    }

    const loginType = this.getLoginTypeByVerificationType(verificationType);
    
    if (secretExpiresAt && secretExpiresAt < new Date()) {
      this.logger.warn(`LoginVerifyCommand: Secret expired for user ${user.id}`);
      throw new LoginSessionExpiredException('Login session is expired');
    }

    if (!this.isValidCode(secret, verificationCode)) {
      await this.domainServices.userServices.applyFailedLoginAttempt(user);
      this.logger.warn(`LoginVerifyCommand: Verification code mismatch for user ${user.id}`);
      throw new VerificationCodeMismatchException('Verification code mismatch');
    }

    const result = await this.generateLoginPayload(user.id, user.onboardStatus || '');

    user.secret = null;
    user.secretExpiresAt = null;
    user.verificationType = null;
    user.verificationAttempts = 0;

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
    // this.eventPublisher.publish()

    return result;
  }

  private isValidCode(secret: string, code: string | undefined): boolean {
    if (this.isDevelopmentEnvironment() && code === '000000') {
      return true;
    }

    return secret === code;
  }
}

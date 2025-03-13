import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerificationCodeResendCommand } from './registration.commands';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { RegistrationTransitionMessage, RegistrationTransitionResultDto } from '../../../dto';
import { RegistrationStatus } from '@library/entity/enum';
import { generateSecureCode } from '@library/shared/common/helpers';

const pendingStates: RegistrationStatus[] = [
  RegistrationStatus.EmailVerifying,
  RegistrationStatus.PhoneNumberVerifying,
];

@CommandHandler(VerificationCodeResendCommand)
export class VerificationCodeResendCommandHandler
  extends RegistrationBaseCommandHandler<VerificationCodeResendCommand>
  implements ICommandHandler<VerificationCodeResendCommand>
{
  public async execute(command: VerificationCodeResendCommand): Promise<RegistrationTransitionResultDto> {
    const {
      payload: { id: userId },
    } = command;

    if (!userId) {
      throw new Error('User id cannot be null when initiating verification code re-send.');
    }

    const registration = await this.getUserRegistration(userId);

    if (!registration || !pendingStates.includes(registration.status)) {
      return this.createTransitionResult(
        registration?.status ?? RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NotAwaitingForCode
      );
    }

    const verificationCode = generateSecureCode(6); // Generate new Verification code
    const verificationCodeExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now

    this.logger.debug(`About to re-generate verification code to user ${userId}`);

    registration.secret = verificationCode;
    registration.secretExpiresAt = verificationCodeExpiresAt;

    await this.data.userRegistrations.update(registration.id, registration);

    this.logger.debug(`Successfully re-generated verification code to user ${userId}`);

    return this.createTransitionResult(registration.status, true, null, userId, verificationCode);
  }
}

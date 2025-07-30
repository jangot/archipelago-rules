import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  INotificationMessageRequest,
  INotificationMessageResult,
} from '@notification/interfaces/inotification-message';
import { INotificationProvider } from '@notification/interfaces/inotification-provider';
import { decode } from 'he';
import { Twilio } from 'twilio';
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';
import { BaseNotificationProvider } from '@notification/providers/base-notification-provider';

const failedStatuses = new Set(['failed', 'undelivered', 'canceled']);

@Injectable()
export class TwilioNotificationProvider extends BaseNotificationProvider implements INotificationProvider, OnModuleInit {
  private readonly logger: Logger = new Logger(TwilioNotificationProvider.name);
  private twilioClient?: Twilio;
  private from: string;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  onModuleInit(): any {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.from = this.configService.getOrThrow<string>('TWILIO_PHONE_NUMBER');
      this.twilioClient = new Twilio(accountSid, authToken);
    }
  }

  async sendMessage(message: INotificationMessageRequest): Promise<INotificationMessageResult> {
    const target = message.user.phone;
    const body = message.header ? message.header + '\n' + decode(message.body) : decode(message.body);

    this.logger.debug(`Sending SMS message to ${target} ...`, {
      header: message.header,
      body: message.body,
    });

    if (this.isTestPhoneNumber(target)) {
      this.logger.debug(`Skipping SMS send for test phone number: ${target}`);
      return this.buildResult(message, target, 'skipped:test_number');
    }
    const twilioMessage = {
      from: this.from,
      to: target,
      body,
    };

    try {
      await this.send(twilioMessage);
      this.logger.debug(`SMS message sent successfully to ${target}`);
      return this.buildResult(message, target, 'success');
    } catch (error) {
      this.logger.error('Error when sending SMS message', { twilioMessage, error });
      return this.buildResult(message, target, 'error');
    }
  }

  private isTestPhoneNumber(number: string): boolean {
    const digits = number.match(/[0-9]/g);
    if (!digits) return false;

    return digits.reverse().join('').slice(4, 7) === '555';
  }

  private async send(twilioMessage: MessageListInstanceCreateOptions) {
    if (!this.twilioClient) {
      throw new Error('Twilio client was not setup, possible env were not passed');
    }

    const responseMessage = await this.twilioClient.messages.create(twilioMessage);
    const { status, errorCode, errorMessage = 'Unknown error' } = responseMessage;

    if (failedStatuses.has(status)) {
      this.logger.error('SMS message failed to send', { responseMessage, errorCode, errorMessage });
      throw new Error(`Twilio message failed: ${errorMessage} (Code: ${errorCode})`);
    }
  }

  protected buildResult(message: INotificationMessageRequest, target: string, status: string): INotificationMessageResult {
    return super.buildResult(message, target, status, 'twilio');
  }
}

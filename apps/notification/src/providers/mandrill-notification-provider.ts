import * as mailchimp from '@mailchimp/mailchimp_transactional';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isPlainObject } from 'lodash';

import {
  INotificationMessageRequest,
  INotificationMessageResult,
} from '@notification/interfaces/inotification-message';
import { INotificationProvider } from '@notification/interfaces/inotification-provider';
import { BaseNotificationProvider } from '@notification/providers/base-notification-provider';

@Injectable()
export class MandrillNotificationProvider extends BaseNotificationProvider implements INotificationProvider, OnModuleInit {
  private readonly logger: Logger = new Logger(MandrillNotificationProvider.name);
  private mailchimpClient: mailchimp.ApiClient;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  onModuleInit(): void {
    const apiKey = this.configService.getOrThrow<number>('MANDRILL_API_KEY');
    this.mailchimpClient = mailchimp(apiKey);
  }

  async sendMessage(message: INotificationMessageRequest): Promise<INotificationMessageResult> {
    const target = message.user.email;
    const title = message.header;
    const messageBody = message.body;

    if (this.isTestEmail(target)) {
      this.logger.debug(`Skipping send for test email: ${target}`);
      return this.buildResult(message, target, 'test email');
    }

    try {
      const globalVars = this.formatTemplateVars(message);
      await this.sendEmail(messageBody, target, title, globalVars);

      this.logger.debug(`Email sent successfully to ${target}`);
      return this.buildResult(message, target, 'success');
    } catch (error) {
      this.logger.error(`Error when sending email to ${target}`, { error });
      throw error;
    }
  }

  private isTestEmail(email: string): boolean {
    return email.endsWith('.example') || email.endsWith('.test');
  }

  private formatTemplateVars(message: INotificationMessageRequest): mailchimp.MergeVar[] {
    const { user, header, body, metadata } = message;

    const flattened = this.flattenObject({
      USER: {
        ID: user.id,
        EMAIL: user.email,
        PHONE: user.phone,
        FIRSTNAME: user.firstName,
        LASTNAME: user.lastName,
        FULLNAME: `${user.firstName} ${user.lastName}`,
      },
      MESSAGE: {
        HEADER: header,
        BODY: body,
        METADATA: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
      },
      DATE: new Date().toISOString(),
    });

    return Object.entries(flattened).map(([name, content]) => ({ name, content }));
  }

  private async sendEmail(
    messageBody: string,
    target: string,
    title: string,
    globalVars: mailchimp.MergeVar[],
  ): Promise<void> {
    const message: mailchimp.MessagesSendRequest = {
      message: {
        subject: title,
        html: messageBody,
        to: target,
        from_email: 'team@zirtue.com',
        from_name: 'Zirtue',
        merge: true,
        merge_language: 'handlebars',
        global_merge_vars: globalVars,
      },
    };

    const result = await this.mailchimpClient.messages.send(message);

    if (Array.isArray(result) && result.length > 0) {
      result.forEach(response => {
        if (response.status === 'rejected') {
          this.logger.error(`Email rejected for ${target}`, { response });
          throw new Error(`Email rejected: ${response.reject_reason || 'Unknown reason'}`);
        }
      });
    }
  }

  private flattenObject(obj: Record<string, any>, parentKey = '', result: Record<string, any> = {}): Record<string, any> {
    for (const [key, value] of Object.entries(obj)) {
      const newKey = parentKey ? `${parentKey}_${key}`.toUpperCase() : key.toUpperCase();

      if (isPlainObject(value)) {
        this.flattenObject(value, newKey, result);
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  protected buildResult(message: INotificationMessageRequest, target: string, status: string): INotificationMessageResult {
    return super.buildResult(message, target, status, 'mandrill');
  }
}

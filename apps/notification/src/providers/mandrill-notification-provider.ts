import * as mailchimp from '@mailchimp/mailchimp_transactional';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { flattenObject } from '@library/shared/common/helper';
import {
  INotificationMessageRequest,
  INotificationMessageResult,
} from '@notification/interfaces/inotification-message';
import { INotificationProvider } from '@notification/interfaces/inotification-provider';
import { BaseNotificationProvider } from '@notification/providers/base-notification-provider';
import { EmailMapperService } from '@notification/services/email-mapper.service';

@Injectable()
export class MandrillNotificationProvider extends BaseNotificationProvider implements INotificationProvider, OnModuleInit {
  private readonly logger: Logger = new Logger(MandrillNotificationProvider.name);
  private mailchimpClient: mailchimp.ApiClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateBuilder: EmailMapperService,
  ) {
    super();
  }

  onModuleInit(): void {
    const apiKey = this.configService.getOrThrow<number>('MANDRILL_API_KEY');
    this.mailchimpClient = mailchimp(apiKey);
  }

  async send(message: INotificationMessageRequest): Promise<INotificationMessageResult> {
    const target = message.user.email;
    const title = message.header;
    const messageBody = message.body;

    if (!target) {
      this.logger.debug('Skipping send because no target');
      return this.buildResult(message, target, 'skipped:no_email');
    }

    if (this.isTestEmail(target)) {
      this.logger.debug({ info: `Skipping send for test email: ${target}`, message });
      return this.buildResult(message, target, 'skipped:test_email');
    }
    try {
      if (message.attributes['template'] === true) {
        const globalVars = this.formatTemplateVars(message, JSON.parse(message.body));
        await this.sendEmailWithTemplate(target, title, globalVars);
      } else {
        const globalVars = this.formatTemplateVars(message);
        await this.sendEmail(messageBody, target, title, globalVars);
      }

      this.logger.debug(`Email sent successfully to ${target}`);
      return this.buildResult(message, target, 'success');
    } catch (error) {
      this.logger.error('Send email error', { error });
      return this.buildResult(message, target, 'error');
    }
  }

  private isTestEmail(email: string): boolean {
    return email.endsWith('.example') || email.endsWith('.test');
  }

  private formatTemplateVars(message: INotificationMessageRequest, extraData = {}): mailchimp.MergeVar[] {
    const { user, header, body, metadata } = message;

    const params = {
      user: {
        ...user,
        fullName: [user.firstName, user.lastName].join(' '),
      },
      header,
      body,
      metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
      date: new Date().toISOString(),
      ...extraData,
    };


    return Object
      .entries(flattenObject(params))
      .filter(([name, content]) => !!content)
      .map(([name, content]) => ({ name, content }));
  }

  private async sendEmail(
    messageBody: string,
    target: string,
    title: string,
    globalVars: mailchimp.MergeVar[],
  ): Promise<void> {
    this.logger.debug('Send email without template');
    const emailTargets = this.getEmailToList(target);

    const message = this.templateBuilder.buildHtmlRequest(emailTargets, messageBody, title, globalVars);

    const result = await this.mailchimpClient.messages.send(message);

    for (const { status, reason } of result ?? []) {
      if (status === 'rejected') {
        this.logger.error(`Email rejected for ${target}`, { reason });
        throw new Error(`Email rejected: ${reason?.reject_reason || 'Unknown reason'}`);
      }
    }
  }

  private async sendEmailWithTemplate(
    target: string,
    templateId: string,
    globalVars: mailchimp.MergeVar[],
  ): Promise<void> {
    this.logger.debug(`Send email with template: ${templateId}`);
    const emailTargets = this.getEmailToList(target);
    const message = this.templateBuilder.buildTemplateRequest(emailTargets, templateId, globalVars);

    const result = await this.mailchimpClient.messages.sendTemplate(message);

    for (const { status, reason } of result ?? []) {
      if (status === 'rejected') {
        this.logger.error(`Email rejected for ${target}`, { reason });
        throw new Error(`Email rejected: ${reason?.reject_reason || 'Unknown reason'}`);
      }
    }
  }


  private getEmailToList(target: string): mailchimp.MessageRecipient[] {
    return target
      .split(',')
      .map(email => email.trim())
      .filter(email => !!email)
      .map(email => ({
        email,
        type: 'to',
      }));
  }

  protected buildResult(message: INotificationMessageRequest, target: string, status: string): INotificationMessageResult {
    return super.buildResult(message, target, status, 'mandrill');
  }
}

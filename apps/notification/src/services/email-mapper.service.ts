import * as mailchimp from '@mailchimp/mailchimp_transactional';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailMapperService {
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly templateEngine: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get('MANDRILL_EMAIL_FROM', 'team@zirtue.com');
    this.fromName = this.configService.get('MANDRILL_NAME_FROM', 'Zirtue');
    this.templateEngine = 'handlebars';
  }

  public buildTemplateRequest(
    to: mailchimp.MessageRecipient[],
    templateName: string,
    globalVars: mailchimp.MergeVar[],
  ): mailchimp.MessagesSendRequest {
    return {
      template_name: templateName,
      template_content: [],
      message: {
        to,
        subject: undefined,
        from_email: this.fromEmail,
        from_name: this.fromName,
        merge: true,
        merge_language: this.templateEngine,
        global_merge_vars: globalVars,
      },
    };
  }

  public buildHtmlRequest(
    to: mailchimp.MessageRecipient[],
    html: string,
    subject: string,
    globalVars: mailchimp.MergeVar[],
  ): mailchimp.MessagesSendRequest {
    return {
      message: {
        to,
        subject,
        html,
        from_email: this.fromEmail,
        from_name: this.fromName,
        merge: true,
        merge_language: this.templateEngine,
        global_merge_vars: globalVars,
      },
    };
  }
}

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';

import {
  INotificationMessageRequest,
  INotificationMessageResult,
} from '@notification/interfaces/inotification-message';
import { INotificationProvider } from '@notification/interfaces/inotification-provider';
import { BaseNotificationProvider } from '@notification/providers/base-notification-provider';

@Injectable()
export class AmplitudeNotificationProvider extends BaseNotificationProvider implements INotificationProvider, OnModuleInit {
  private readonly logger: Logger = new Logger(AmplitudeNotificationProvider.name);
  private amplitudeClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  onModuleInit(): void {
    this.initializeAmplitudeClient();
  }

  private initializeAmplitudeClient(): void {
    const amplitudeApiKey = this.configService.getOrThrow<string>('AMPLITUDE_API_KEY');
    const baseURL = this.configService.getOrThrow<string>('AMPLITUDE_API_BASE_URL');

    this.amplitudeClient = this.httpService.axiosRef.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.amplitudeClient.interceptors.request.use((config) => {
      if (config.data && typeof config.data === 'object') {
        config.data.api_key = amplitudeApiKey;
      }
      return config;
    });
  }

  async send(message: INotificationMessageRequest): Promise<INotificationMessageResult> {
    const target = message.user.email;
    const amplitudeMessage = message.message;

    if (!amplitudeMessage) {
      this.logger.debug('No message content for Amplitude, skipping');
      return this.buildResult(message, target, 'skipped:no_message');
    }

    this.logger.debug(`Sending Amplitude message to ${target}`, {
      header: message.header,
      message: amplitudeMessage,
    });

    const events = this.parseEvents(amplitudeMessage);
    if (events.length === 0) {
      this.logger.debug('No valid events found in message, skipping');
      return this.buildResult(message, target, 'skipped:no_events');
    }

    try {
      await this.amplitudeClient.post('/', {
        events,
      });

      this.logger.debug(`Amplitude message sent successfully to ${target}`);
    } catch (error) {
      this.logger.error(`Error when sending Amplitude message to ${target}`, {
        error,
        events,
      });
      throw error;
    }

    return this.buildResult(message, target, 'success');
  }

  private parseEvents(input: string): any[] {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      this.logger.warn('Failed to parse events from message', { input });
      return [];
    }
  }

  protected buildResult(message: INotificationMessageRequest, target: string, status: string): INotificationMessageResult {
    return super.buildResult(message, target, status, 'amplitude');
  }
}

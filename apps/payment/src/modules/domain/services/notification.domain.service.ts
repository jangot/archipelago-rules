import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { NotificationDefinition } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentDataService } from '@payment/modules/data';

/**
 * Service for managing notification definitions in payment application
 *
 * @description Handles business logic for notification definitions
 */
@Injectable()
export class NotificationDomainService extends BaseDomainServices {
  private readonly logger = new Logger(NotificationDomainService.name);

  constructor(
    protected readonly data: PaymentDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  /**
   * Find notification definition by name
   *
   * @param name - The name of the notification definition to find
   * @returns Promise<NotificationDefinition | null>
   */
  async findByName(name: string): Promise<NotificationDefinition | null> {
    this.logger.debug(`Finding notification definition by name: ${name}`);
    return this.data.notificationDefinitions.findByName(name);
  }
}
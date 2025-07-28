import { INotificationDefinitionItem } from '@library/entity/interface/notification-definition-item.interface';
import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationDataService } from '../../data';
import { NotificationDefinitionItem } from '../entity';

/**
 * Service for managing notification definition items
 *
 * @description Handles business logic for notification definition items
 */
@Injectable()
export class NotificationDefinitionItemDomainService extends BaseDomainServices {
  private readonly logger = new Logger(NotificationDefinitionItemDomainService.name);

  constructor(
    protected readonly data: NotificationDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  /**
   * Get all notification definition items
   *
   * @returns Array of INotificationDefinitionItem
   */
  async getAllItems(): Promise<INotificationDefinitionItem[]> {
    return this.data.notificationDefinitionItems.getAll();
  }

  /**
   * Get a notification definition item by ID
   *
   * @param id - The ID of the notification definition item to retrieve
   * @returns A INotificationDefinitionItem
   */
  async getItemById(id: string): Promise<INotificationDefinitionItem | null> {
    return this.data.notificationDefinitionItems.getById(id);
  }

  /**
   * Create a new notification definition item
   *
   * @param notificationDefinitionItem - The notification definition item to create
   * @returns A INotificationDefinitionItem for the created item
   */
  async createItem(notificationDefinitionItem: NotificationDefinitionItem): Promise<INotificationDefinitionItem | null> {
    return this.data.notificationDefinitionItems.insert(notificationDefinitionItem, true);
  }

  /**
   * Update an existing notification definition item
   *
   * @param id - The ID of the notification definition item to update
   * @param notificationDefinitionItem - The notification definition item containing the update data
   * @returns boolean indicating success
   */
  async updateItem(id: string, notificationDefinitionItem: Partial<NotificationDefinitionItem>): Promise<boolean | null> {
    return this.data.notificationDefinitionItems.update(id, notificationDefinitionItem);
  }

  /**
   * Delete a notification definition item
   *
   * @param id - The ID of the notification definition item to delete
   * @returns boolean indicating success
   */
  async deleteItem(id: string): Promise<boolean | null> {
    return this.data.notificationDefinitionItems.delete(id);
  }

  /**
   * Find notification definition items by notification definition ID
   *
   * @param notificationDefinitionId - The ID of the parent notification definition
   * @returns Promise<INotificationDefinitionItem[]>
   */
  async findByNotificationDefinitionId(notificationDefinitionId: string): Promise<INotificationDefinitionItem[]> {
    this.logger.debug(`Finding notification definition items by notification definition ID: ${notificationDefinitionId}`);
    const result = await this.data.notificationDefinitionItems.findBy({
      notificationDefinitionId,
    });
    return result.data;
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { INotificationDefinition } from '@library/entity/entity-interface';
import { ConfigService } from '@nestjs/config';
import { DeepPartial } from 'typeorm';
import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { NotificationDataService } from '@notification/data';

/**
 * Service for managing notification definitions
 * 
 * @description Handles business logic for notification definitions
 */
@Injectable()
export class NotificationDomainService extends BaseDomainServices {
  private readonly logger = new Logger(NotificationDomainService.name);

  constructor(
    protected readonly data: NotificationDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  /**
   * Get all notification definitions
   * 
   * @returns Array of NotificationDefinitionResponseDto DTOs
   */
  async getAllDefinitions(): Promise<INotificationDefinition[]> {
    return this.data.notificationDefinitions.getAll();
  }

  /**
   * Get a notification definition by ID
   * 
   * @param id - The ID of the notification definition to retrieve
   * @returns A NotificationDefinitionResponseDto DTO
   * @throws NotFoundException if no definition is found with the provided ID
   */
  async getDefinitionById(id: string): Promise<INotificationDefinition | null> {
    return this.data.notificationDefinitions.getById(id);
  }

  /**
   * Create a new notification definition
   * 
   * @param notificationDefinition - The DTO containing the data for the new definition
   * @returns A NotificationDefinitionResponseDto DTO for the created definition
   */
  async createDefinition(notificationDefinition: DeepPartial<INotificationDefinition>): Promise<INotificationDefinition | null> {
    return this.data.notificationDefinitions.insert(notificationDefinition, true);
  }

  /**
   * Update an existing notification definition
   * 
   * @param id - The ID of the notification definition to update
   * @param notificationDefinition - The DTO containing the update data
   * @returns A NotificationDefinitionResponseDto DTO for the updated definition
   * @throws NotFoundException if no definition is found with the provided ID
   */
  async updateDefinition(id: string, notificationDefinition: DeepPartial<INotificationDefinition>): Promise<boolean | null> {
    return this.data.notificationDefinitions.update(id, notificationDefinition);
  }

  /**
   * Delete a notification definition
   * 
   * @param id - The ID of the notification definition to delete
   * @returns true if deletion was successful
   * @throws NotFoundException if no definition is found with the provided ID
   */
  async deleteDefinition(id: string): Promise<boolean> {
    return this.data.notificationDefinitions.delete(id);
  }
}

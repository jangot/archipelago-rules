import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationDefinition } from '@library/shared/domain/entity';
import { Not } from 'typeorm';
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
  async getAllDefinitions(): Promise<NotificationDefinition[]> {
    return this.data.notificationDefinitions.getAll();
  }

  /**
   * Get a notification definition by ID
   *
   * @param id - The ID of the notification definition to retrieve
   * @returns A NotificationDefinitionResponseDto DTO
   * @throws NotFoundException if no definition is found with the provided ID
   */
  async getDefinitionById(id: string): Promise<NotificationDefinition | null> {
    return this.data.notificationDefinitions.getById(id);
  }

  /**
   * Create a new notification definition
   *
   * @param notificationDefinition - The DTO containing the data for the new definition
   * @returns A NotificationDefinitionResponseDto DTO for the created definition
   */
  async createDefinition(notificationDefinition: NotificationDefinition): Promise<NotificationDefinition | null> {
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
  async updateDefinition(id: string, notificationDefinition: Partial<NotificationDefinition>): Promise<boolean | null> {
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

  /**
   * Find notification definition by name
   *
   * @param name - The name of the notification definition to find
   * @returns Promise<NotificationDefinition | null>
   */
  async findByNameWithItems(name: string): Promise<NotificationDefinition | null> {
    this.logger.debug(`Finding notification definition by name: ${name}`);
    return this.data.notificationDefinitions.findOne({
      where: { name },
      relations: ['items'],
    });
  }

  /**
   * Find notification definition by name
   * @param name - The name of the notification definition
   * @returns Promise<NotificationDefinition | null>
   */
  async findByName(name: string): Promise<NotificationDefinition | null> {
    this.logger.debug(`Finding notification definition by name: ${name}`);
    return this.data.notificationDefinitions.findOne({
      where: { name },
    });
  }

  /**
   * Find notification definition by name exclude specific id
   * @param name - The name of the notification definition
   * @param id - The id to exclude
   * @returns Promise<NotificationDefinition | null>
   */
  async findByNameExcludeId(name: string, id: string): Promise<NotificationDefinition | null> {
    this.logger.debug(`Finding notification definition by name: ${name}`);
    return this.data.notificationDefinitions.findOne({
      where: { name, id: Not(id) },
    });
  }
}

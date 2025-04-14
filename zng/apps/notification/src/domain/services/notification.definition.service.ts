import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationDefinition } from '../entities/notification.definition.entity';
import { INotificationDefinitionRepository } from '../interfaces/inotification.definition.repository';
import { CreateNotificationDefinitionRequestDto } from '../../dto/request/create-notification-definition.request.dto';
import { UpdateNotificationDefinitionRequestDto } from '../../dto/request/update-notification-definition.request.dto';
import { NotificationDefinitionResponseDto } from '../../dto/response/notification-definition.response.dto';

/**
 * Service for managing notification definitions
 * 
 * @description Handles business logic for notification definitions
 */
@Injectable()
export class NotificationDefinitionService {
  constructor(
    private readonly notificationDefinitionRepository: INotificationDefinitionRepository,
  ) {}

  /**
   * Maps a NotificationDefinition entity to a NotificationDefinitionResponseDto DTO
   * 
   * @param definition - The NotificationDefinition entity to map
   * @returns A NotificationDefinitionResponseDto DTO
   */
  private mapToResponse(definition: NotificationDefinition): NotificationDefinitionResponseDto {
    const response = new NotificationDefinitionResponseDto();
    response.id = definition.id;
    response.name = definition.name;
    response.createdAt = definition.createdAt;
    response.updatedAt = definition.updatedAt;
    return response;
  }

  /**
   * Get all notification definitions
   * 
   * @returns Array of NotificationDefinitionResponseDto DTOs
   */
  async getAllDefinitions(): Promise<NotificationDefinitionResponseDto[]> {
    const definitions = await this.notificationDefinitionRepository.findAll();
    return definitions.map(definition => this.mapToResponse(definition));
  }

  /**
   * Get a notification definition by ID
   * 
   * @param id - The ID of the notification definition to retrieve
   * @returns A NotificationDefinitionResponseDto DTO
   * @throws NotFoundException if no definition is found with the provided ID
   */
  async getDefinitionById(id: string): Promise<NotificationDefinitionResponseDto> {
    const definition = await this.notificationDefinitionRepository.findById(id);
    
    if (!definition) {
      throw new NotFoundException(`Notification definition with ID ${id} not found`);
    }
    
    return this.mapToResponse(definition);
  }

  /**
   * Create a new notification definition
   * 
   * @param createDto - The DTO containing the data for the new definition
   * @returns A NotificationDefinitionResponseDto DTO for the created definition
   */
  async createDefinition(createDto: CreateNotificationDefinitionRequestDto): Promise<NotificationDefinitionResponseDto> {
    const newDefinition = await this.notificationDefinitionRepository.create({
      name: createDto.name,
    });
    
    return this.mapToResponse(newDefinition);
  }

  /**
   * Update an existing notification definition
   * 
   * @param id - The ID of the notification definition to update
   * @param updateDto - The DTO containing the update data
   * @returns A NotificationDefinitionResponseDto DTO for the updated definition
   * @throws NotFoundException if no definition is found with the provided ID
   */
  async updateDefinition(id: string, updateDto: UpdateNotificationDefinitionRequestDto): Promise<NotificationDefinitionResponseDto> {
    try {
      const updatedDefinition = await this.notificationDefinitionRepository.update(id, updateDto);
      return this.mapToResponse(updatedDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update notification definition: ${error.message}`);
    }
  }

  /**
   * Delete a notification definition
   * 
   * @param id - The ID of the notification definition to delete
   * @returns true if deletion was successful
   * @throws NotFoundException if no definition is found with the provided ID
   */
  async deleteDefinition(id: string): Promise<boolean> {
    const definition = await this.notificationDefinitionRepository.findById(id);
    
    if (!definition) {
      throw new NotFoundException(`Notification definition with ID ${id} not found`);
    }
    
    return await this.notificationDefinitionRepository.delete(id);
  }
}

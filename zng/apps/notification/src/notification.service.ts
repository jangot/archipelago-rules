
import { Injectable, Logger } from '@nestjs/common';
import { IDomainServices } from './domain/domain.iservices';
import { NotificationDefinitionResponseDto } from './dto/response/notification-definition.response.dto';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { CreateNotificationDefinitionRequestDto } from './dto/request/create-notification-definition.request.dto';
import { Entity } from 'typeorm';
import { NotificationDefinition } from './domain/entities';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { UpdateNotificationDefinitionRequestDto } from './dto/request/update-notification-definition.request.dto';

@Injectable()
export class NotificationService {
  private readonly logger: Logger = new Logger(NotificationService.name);
  constructor(private readonly domainServices: IDomainServices) {}

  public async getAllDefinitions(): Promise<NotificationDefinitionResponseDto[]> {
    this.logger.debug('getAllDefinitions: Getting all notification definitions');
    const result = await this.domainServices.notificationServices.getAllDefinitions();

    if (result?.length === 0) {
      return [];
    }

    const dtoResult = result.map((item) => DtoMapper.toDto(item, NotificationDefinitionResponseDto)).filter((item) => item !== null);

    return dtoResult;
  }

  @MapToDto(NotificationDefinitionResponseDto)
  public async createDefinition(notificationDefinition: CreateNotificationDefinitionRequestDto): Promise<NotificationDefinitionResponseDto | null> {
    this.logger.debug('createDefinition: Creating notification definition');

    const definition = EntityMapper.toEntity(notificationDefinition, NotificationDefinition);
    const result = await this.domainServices.notificationServices.createDefinition(definition);
    
    return result as unknown as NotificationDefinitionResponseDto | null;
  }

  @MapToDto(NotificationDefinitionResponseDto)
  public async getDefinitionById(id: string): Promise<NotificationDefinitionResponseDto | null> {
    this.logger.debug(`getDefinitionById: Getting notification definition by ID: ${id}`);
    const result = await this.domainServices.notificationServices.getDefinitionById(id);

    return result as unknown as NotificationDefinitionResponseDto | null;
  }

  public async updateDefinition(id: string, notificationDefinition: UpdateNotificationDefinitionRequestDto): Promise<boolean | null> {
    this.logger.debug(`updateDefinition: Updating notification definition with ID: ${id}`);
    const definition = EntityMapper.toEntity(notificationDefinition, NotificationDefinition);
    const result = await this.domainServices.notificationServices.updateDefinition(id, definition);

    return result;
  }

  public async deleteDefinition(id: string): Promise<boolean | null> {
    this.logger.debug(`deleteDefinition: Deleting notification definition with ID: ${id}`);
    const result = await this.domainServices.notificationServices.deleteDefinition(id);

    return result;
  }
}

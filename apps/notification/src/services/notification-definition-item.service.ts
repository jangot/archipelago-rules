import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { Injectable, Logger } from '@nestjs/common';
import { IDomainServices } from '@notification/domain/domain.iservices';
import { NotificationDefinitionItem } from '@notification/domain/entity';
import { CreateNotificationDefinitionItemRequestDto } from '@notification/dto';
import { UpdateNotificationDefinitionItemRequestDto } from '@notification/dto';
import { NotificationDefinitionItemResponseDto } from '@notification/dto';

@Injectable()
export class NotificationDefinitionItemService {
  private readonly logger: Logger = new Logger(NotificationDefinitionItemService.name);
  constructor(private readonly domainServices: IDomainServices) {}

  public async getAllItems(): Promise<NotificationDefinitionItemResponseDto[]> {
    this.logger.debug('getAllItems: Getting all notification definition items');
    const result = await this.domainServices.notificationDefinitionItemServices.getAllItems();

    if (result?.length === 0) {
      return [];
    }

    const dtoResult = result.map((item) => DtoMapper.toDto(item, NotificationDefinitionItemResponseDto)).filter((item) => item !== null);

    return dtoResult;
  }

  public async getItemById(id: string): Promise<NotificationDefinitionItemResponseDto | null> {
    this.logger.debug(`getItemById: Getting notification definition item with ID: ${id}`);
    const result = await this.domainServices.notificationDefinitionItemServices.getItemById(id);

    if (!result) {
      return null;
    }

    return DtoMapper.toDto(result, NotificationDefinitionItemResponseDto);
  }

  public async createItem(notificationDefinitionItem: CreateNotificationDefinitionItemRequestDto): Promise<NotificationDefinitionItemResponseDto | null> {
    this.logger.debug('createItem: Creating notification definition item');

    const item = EntityMapper.toEntity(notificationDefinitionItem, NotificationDefinitionItem);
    const result = await this.domainServices.notificationDefinitionItemServices.createItem(item);

    return DtoMapper.toDto(result, NotificationDefinitionItemResponseDto);
  }

  public async updateItem(id: string, notificationDefinitionItem: UpdateNotificationDefinitionItemRequestDto): Promise<boolean | null> {
    this.logger.debug(`updateItem: Updating notification definition item with ID: ${id}`);
    const item = EntityMapper.toEntity(notificationDefinitionItem, NotificationDefinitionItem);
    const result = await this.domainServices.notificationDefinitionItemServices.updateItem(id, item);

    return result;
  }

  public async deleteItem(id: string): Promise<boolean | null> {
    this.logger.debug(`deleteItem: Deleting notification definition item with ID: ${id}`);
    const result = await this.domainServices.notificationDefinitionItemServices.deleteItem(id);

    return result;
  }

  public async findByNotificationDefinitionId(notificationDefinitionId: string): Promise<NotificationDefinitionItemResponseDto[]> {
    this.logger.debug(`findByNotificationDefinitionId: Finding notification definition items by notification definition ID: ${notificationDefinitionId}`);
    const result = await this.domainServices.notificationDefinitionItemServices.findByNotificationDefinitionId(notificationDefinitionId);

    if (result?.length === 0) {
      return [];
    }

    const dtoResult = result.map((item) => DtoMapper.toDto(item, NotificationDefinitionItemResponseDto)).filter((item) => item !== null);

    return dtoResult;
  }
}

import { BadRequestException, Inject, Injectable, PipeTransform } from '@nestjs/common';
import { NotificationDomainService } from '@notification/domain/services/notification.definition.service';
import { CreateNotificationDefinitionRequestDto, UpdateNotificationDefinitionRequestDto } from '@notification/dto';
import { REQUEST } from '@nestjs/core';

/**
 * Pipe to validate that notification definition name is unique
 */
@Injectable()
export class UniqueNotificationDefinitionNamePipe implements PipeTransform {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async transform(
    value: CreateNotificationDefinitionRequestDto | UpdateNotificationDefinitionRequestDto
  ): Promise<CreateNotificationDefinitionRequestDto | UpdateNotificationDefinitionRequestDto> {
    if (!value.name) {
      return value;
    }

    const existingDefinition = await this.findDefinition(value.name, this.request['params']?.id);
    if (existingDefinition) {
      throw new BadRequestException(`Notification definition with name '${value.name}' already exists`);
    }

    return value;
  }

  private async findDefinition(name: string, id?: string) {
    if (id) {
      return this.notificationDomainService.findByNameExcludeId(name, id);
    }

    return this.notificationDomainService.findByName(name);
  }
}

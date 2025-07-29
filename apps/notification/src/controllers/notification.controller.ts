import { EntityFailedToUpdateException } from '@library/shared/common/exception/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateNotificationDefinitionRequestDto, NotificationDefinitionResponseDto, UpdateNotificationDefinitionRequestDto } from '@notification/dto';
import { NotificationService } from '@notification/services/notification.service';

@ApiTags('notifications')
@Controller()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Retrieve all notification definitions
   *
   * @returns Array of NotificationDefinitionResponseDto DTOs
   */
  @Get('notification-definitions')
  @ApiOperation({ summary: 'Get all notification definitions' })
  @ApiOkResponse({ description: 'The notification definitions have been successfully retrieved', type: [NotificationDefinitionResponseDto], isArray: true })
  @ApiNoContentResponse({ description: 'No notification definitions found', isArray: false })
  async getAllDefinitions(): Promise<NotificationDefinitionResponseDto[]> {
    const result = await this.notificationService.getAllDefinitions();

    if (result?.length === 0) {
      throw new HttpException('No Notification Definitions found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  /**
   * Retrieve a notification definition by ID
   *
   * @param id - The ID of the notification definition to retrieve
   * @returns A NotificationDefinitionResponseDto DTO
   */
  @Get('notification-definitions/:id')
  @ApiOperation({ summary: 'Get a notification definition by ID' })
  @ApiParam({ name: 'id', description: 'The notification definition ID', type: String })
  @ApiOkResponse({ description: 'The notification definition has been successfully retrieved', type: NotificationDefinitionResponseDto, isArray: false })
  @ApiNoContentResponse({ description: 'No notification definition found', isArray: false })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The notification definition was not found',
  })
  async getDefinitionById(@Param('id') id: string): Promise<NotificationDefinitionResponseDto> {
    const result = await this.notificationService.getDefinitionById(id);

    if (!result) {
      throw new HttpException('Notification Definition not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  /**
   * Create a new notification definition
   *
   * @param createDto - The DTO containing the data for the new definition
   * @returns A NotificationDefinitionResponseDto DTO for the created definition
   */
  @Post('notification-definitions')
  @ApiOperation({ summary: 'Create a new notification definition' })
  @ApiCreatedResponse({ description: 'The notification definition has been successfully created', type: NotificationDefinitionResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid request data', isArray: false })
  async createDefinition(
    @Body() createDto: CreateNotificationDefinitionRequestDto,
  ): Promise<NotificationDefinitionResponseDto | null> {
    return this.notificationService.createDefinition(createDto);
  }

  /**
   * Update an existing notification definition
   *
   * @param id - The ID of the notification definition to update
   * @param updateDto - The DTO containing the update data
   * @returns A NotificationDefinitionResponseDto DTO for the updated definition
   */
  @Put('notification-definitions/:id')
  @ApiOperation({ summary: 'Update a notification definition' })
  @ApiParam({ name: 'id', description: 'The notification definition ID', type: String })
  @ApiOkResponse({ description: 'The notification definition has been successfully updated', type: NotificationDefinitionResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid request data', isArray: false })
  @ApiNotFoundResponse({ description: 'The notification definition was not found', isArray: false })
  async updateDefinition(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDefinitionRequestDto,
  ): Promise<boolean> {
    const result = await this.notificationService.updateDefinition(id, updateDto);
    if (!result) {
      throw new EntityFailedToUpdateException('Notification Definition not found');
    }

    return result;
  }

  /**
   * Delete a notification definition
   *
   * @param id - The ID of the notification definition to delete
   */
  @Delete('notification-definitions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification definition' })
  @ApiParam({ name: 'id', description: 'The notification definition ID', type: String })
  @ApiNoContentResponse({ description: 'The notification definition has been successfully deleted', isArray: false })
  @ApiNotFoundResponse({ description: 'The notification definition was not found', isArray: false })
  async deleteDefinition(@Param('id') id: string): Promise<boolean> {
    const result = await this.notificationService.deleteDefinition(id);

    if (!result) {
      throw new HttpException('Notification Definition not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }
}

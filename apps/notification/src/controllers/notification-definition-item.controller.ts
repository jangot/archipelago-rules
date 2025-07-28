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
import { CreateNotificationDefinitionItemRequestDto } from '../dto/request/create-notification-definition-item.request.dto';
import { UpdateNotificationDefinitionItemRequestDto } from '../dto/request/update-notification-definition-item.request.dto';
import { NotificationDefinitionItemResponseDto } from '../dto/response/notification-definition-item.response.dto';
import { NotificationDefinitionItemService } from '../services/notification-definition-item.service';

@ApiTags('notification-definition-items')
@Controller()
export class NotificationDefinitionItemController {
  constructor(
    private readonly notificationDefinitionItemService: NotificationDefinitionItemService,
  ) {}

  /**
   * Retrieve all notification definition items
   *
   * @returns Array of NotificationDefinitionItemResponseDto DTOs
   */
  @Get('notification-definition-items')
  @ApiOperation({ summary: 'Get all notification definition items' })
  @ApiOkResponse({ description: 'The notification definition items have been successfully retrieved', type: [NotificationDefinitionItemResponseDto], isArray: true })
  @ApiNoContentResponse({ description: 'No notification definition items found', isArray: false })
  async getAllItems(): Promise<NotificationDefinitionItemResponseDto[]> {
    const result = await this.notificationDefinitionItemService.getAllItems();

    if (result?.length === 0) {
      throw new HttpException('No Notification Definition Items found', HttpStatus.NO_CONTENT);
    }

    return result;
  }

  /**
   * Retrieve a notification definition item by ID
   *
   * @param id - The ID of the notification definition item to retrieve
   * @returns A NotificationDefinitionItemResponseDto DTO
   */
  @Get('notification-definition-items/:id')
  @ApiOperation({ summary: 'Get a notification definition item by ID' })
  @ApiParam({ name: 'id', description: 'The notification definition item ID', type: String })
  @ApiOkResponse({ description: 'The notification definition item has been successfully retrieved', type: NotificationDefinitionItemResponseDto, isArray: false })
  @ApiNoContentResponse({ description: 'No notification definition item found', isArray: false })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The notification definition item was not found',
  })
  async getItemById(@Param('id') id: string): Promise<NotificationDefinitionItemResponseDto> {
    const result = await this.notificationDefinitionItemService.getItemById(id);

    if (!result) {
      throw new HttpException('Notification Definition Item not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  /**
   * Create a new notification definition item
   *
   * @param createDto - The DTO containing the data for the new item
   * @returns A NotificationDefinitionItemResponseDto DTO for the created item
   */
  @Post('notification-definition-items')
  @ApiOperation({ summary: 'Create a new notification definition item' })
  @ApiCreatedResponse({ description: 'The notification definition item has been successfully created', type: NotificationDefinitionItemResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid request data', isArray: false })
  async createItem(
    @Body() createDto: CreateNotificationDefinitionItemRequestDto,
  ): Promise<NotificationDefinitionItemResponseDto | null> {
    return this.notificationDefinitionItemService.createItem(createDto);
  }

  /**
   * Update an existing notification definition item
   *
   * @param id - The ID of the notification definition item to update
   * @param updateDto - The DTO containing the update data
   * @returns A boolean indicating success
   */
  @Put('notification-definition-items/:id')
  @ApiOperation({ summary: 'Update a notification definition item' })
  @ApiParam({ name: 'id', description: 'The notification definition item ID', type: String })
  @ApiOkResponse({ description: 'The notification definition item has been successfully updated', type: Boolean, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid request data', isArray: false })
  @ApiNotFoundResponse({ description: 'The notification definition item was not found', isArray: false })
  async updateItem(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDefinitionItemRequestDto,
  ): Promise<boolean> {
    const result = await this.notificationDefinitionItemService.updateItem(id, updateDto);
    if (!result) {
      throw new EntityFailedToUpdateException('Notification Definition Item not found');
    }

    return result;
  }

  /**
   * Delete a notification definition item
   *
   * @param id - The ID of the notification definition item to delete
   */
  @Delete('notification-definition-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification definition item' })
  @ApiParam({ name: 'id', description: 'The notification definition item ID', type: String })
  @ApiNoContentResponse({ description: 'The notification definition item has been successfully deleted', isArray: false })
  @ApiNotFoundResponse({ description: 'The notification definition item was not found', isArray: false })
  async deleteItem(@Param('id') id: string): Promise<boolean> {
    const result = await this.notificationDefinitionItemService.deleteItem(id);

    if (!result) {
      throw new HttpException('Notification Definition Item not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  /**
   * Retrieve all notification definition items by notification definition ID
   *
   * @param notificationDefinitionId - The ID of the parent notification definition
   * @returns Array of NotificationDefinitionItemResponseDto DTOs
   */
  @Get('notification-definitions/:notificationDefinitionId/items')
  @ApiOperation({ summary: 'Get all notification definition items by notification definition ID' })
  @ApiParam({ name: 'notificationDefinitionId', description: 'The notification definition ID', type: String })
  @ApiOkResponse({ description: 'The notification definition items have been successfully retrieved', type: [NotificationDefinitionItemResponseDto], isArray: true })
  @ApiNoContentResponse({ description: 'No notification definition items found', isArray: false })
  async getItemsByNotificationDefinitionId(@Param('notificationDefinitionId') notificationDefinitionId: string): Promise<NotificationDefinitionItemResponseDto[]> {
    const result = await this.notificationDefinitionItemService.findByNotificationDefinitionId(notificationDefinitionId);

    if (result?.length === 0) {
      throw new HttpException('No Notification Definition Items found for this definition', HttpStatus.NO_CONTENT);
    }

    return result;
  }
}

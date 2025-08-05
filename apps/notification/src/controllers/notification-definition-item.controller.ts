import { EntityFailedToUpdateException } from '@library/shared/common/exception/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateNotificationDefinitionItemRequestDto, GetNotificationDefinitionItemsRequestDto, NotificationDefinitionItemResponseDto, UpdateNotificationDefinitionItemRequestDto } from '@notification/dto';
import { NotificationDefinitionItemService } from '@notification/services/notification-definition-item.service';
import { NotificationDefinitionItemExistsPipe } from '@notification/pipes/notification-definition-item-exists.pipe';
import { UUIDParam } from '@library/shared/common/pipe/uuidparam';

@ApiTags('notification-definition-items')
@Controller()
export class NotificationDefinitionItemController {
  constructor(
    private readonly notificationDefinitionItemService: NotificationDefinitionItemService,
  ) {}

  /**
   * Retrieve all notification definition items with optional filtering
   *
   * @param filter - Optional query parameters for filtering
   * @returns Array of NotificationDefinitionItemResponseDto DTOs
   */
  @Get('notification-definition-items')
  @ApiOperation({ summary: 'Get all notification definition items with optional filtering' })
  @ApiQuery({ name: 'notificationDefinitionId', description: 'Filter by notification definition ID', required: false, type: String })
  @ApiOkResponse({ description: 'The notification definition items have been successfully retrieved', type: [NotificationDefinitionItemResponseDto], isArray: true })
  @ApiNoContentResponse({ description: 'No notification definition items found', isArray: false })
  async getAllItems(@Query() filter: GetNotificationDefinitionItemsRequestDto): Promise<NotificationDefinitionItemResponseDto[]> {
    const result = await this.notificationDefinitionItemService.getAllItemsWithFilter(filter);

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
  async getItemById(@UUIDParam('id', NotificationDefinitionItemExistsPipe) id: string): Promise<NotificationDefinitionItemResponseDto> {
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
    @UUIDParam('id', NotificationDefinitionItemExistsPipe) id: string,
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
  async deleteItem(@UUIDParam('id', NotificationDefinitionItemExistsPipe) id: string): Promise<boolean> {
    const result = await this.notificationDefinitionItemService.deleteItem(id);

    if (!result) {
      throw new HttpException('Notification Definition Item not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }
}

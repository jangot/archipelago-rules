import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationDefinitionService } from './domain/services/notification.definition.service';
import { CreateNotificationDefinitionRequestDto } from './dto/request/create-notification-definition.request.dto';
import { UpdateNotificationDefinitionRequestDto } from './dto/request/update-notification-definition.request.dto';
import { NotificationDefinitionResponseDto } from './dto/response/notification-definition.response.dto';

@ApiTags('notification')
@Controller()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationDefinitionService: NotificationDefinitionService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
  })
  getHello(): string {
    return this.notificationService.getHello();
  }

  /**
   * Retrieve all notification definitions
   * 
   * @returns Array of NotificationDefinitionResponseDto DTOs
   */
  @Get('notification-definitions')
  @ApiOperation({ summary: 'Get all notification definitions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The notification definitions have been successfully retrieved',
    type: [NotificationDefinitionResponseDto],
  })
  async getAllDefinitions(): Promise<NotificationDefinitionResponseDto[]> {
    return this.notificationDefinitionService.getAllDefinitions();
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The notification definition has been successfully retrieved',
    type: NotificationDefinitionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The notification definition was not found',
  })
  async getDefinitionById(@Param('id') id: string): Promise<NotificationDefinitionResponseDto> {
    return this.notificationDefinitionService.getDefinitionById(id);
  }

  /**
   * Create a new notification definition
   * 
   * @param createDto - The DTO containing the data for the new definition
   * @returns A NotificationDefinitionResponseDto DTO for the created definition
   */
  @Post('notification-definitions')
  @ApiOperation({ summary: 'Create a new notification definition' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The notification definition has been successfully created',
    type: NotificationDefinitionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async createDefinition(
    @Body() createDto: CreateNotificationDefinitionRequestDto,
  ): Promise<NotificationDefinitionResponseDto> {
    return this.notificationDefinitionService.createDefinition(createDto);
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The notification definition has been successfully updated',
    type: NotificationDefinitionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The notification definition was not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async updateDefinition(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDefinitionRequestDto,
  ): Promise<NotificationDefinitionResponseDto> {
    return this.notificationDefinitionService.updateDefinition(id, updateDto);
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
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The notification definition has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The notification definition was not found',
  })
  async deleteDefinition(@Param('id') id: string): Promise<void> {
    await this.notificationDefinitionService.deleteDefinition(id);
  }
}

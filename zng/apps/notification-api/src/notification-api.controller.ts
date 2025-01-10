import { Controller, Get } from '@nestjs/common';
import { NotificationApiService } from './notification-api.service';

@Controller()
export class NotificationApiController {
  constructor(private readonly notificationApiService: NotificationApiService) {}

  @Get()
  getHello(): string {
    return this.notificationApiService.getHello();
  }
}

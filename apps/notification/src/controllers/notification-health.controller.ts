import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class NotificationHealthController {
  @Get()
  health() {
    return { status: 'OK' };
  }
}

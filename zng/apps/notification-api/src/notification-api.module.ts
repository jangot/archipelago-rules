import { Module } from '@nestjs/common';
import { NotificationApiController } from './notification-api.controller';
import { NotificationApiService } from './notification-api.service';

@Module({
  imports: [],
  controllers: [NotificationApiController],
  providers: [NotificationApiService],
})
export class NotificationApiModule {}

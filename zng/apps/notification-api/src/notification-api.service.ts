import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationApiService {
  getHello(): string {
    return 'Hello World!';
  }
}

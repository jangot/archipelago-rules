import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { DataModule } from '@notification/data';
import { DomainModule } from '@notification/domain/domain.module';

export const NotificationModules: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference> = [DataModule, DomainModule];

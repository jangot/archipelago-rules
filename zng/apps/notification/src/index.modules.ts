import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { DataModule } from './data';
import { DomainModule } from './domain/domain.module';

export const NotificationModules: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference> = [DataModule, DomainModule];

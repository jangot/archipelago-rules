/*
 * File Name   : ieventpublisher.ts
 * Author      : Michael LeDuc
 * Created Date: Fri May 30 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import { IZngOldEvent } from './i-zng-old-event';

export interface IEventPublisherService {
  publish<T>(event: IZngOldEvent): T;
}

export const IEventPublisher = Symbol('IEventPublisher');

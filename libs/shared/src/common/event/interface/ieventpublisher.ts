/*
 * File Name   : ieventpublisher.ts
 * Author      : Michael LeDuc
 * Created Date: Fri May 30 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import { IZngEvent } from './izng-event';

export interface IEventPublisher {
  publish<T>(event: IZngEvent): T;
}

export const IEventPublisher = Symbol('IEventPublisher');

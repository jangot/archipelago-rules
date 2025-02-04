/*
 * File Name: loggerMiddleware.ts
 * Author: Michael LeDuc
 * Created Date: Tue Feb 04 2025
 * Copyright (c) 2025 Zirtue, Inc
*/

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Log all requests
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}
  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`${req.method} ${req.originalUrl}`)
    next();
  }
}
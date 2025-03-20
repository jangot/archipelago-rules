/*
 * File Name   : pg-pool-adapter.ts
 * Author      : Michael LeDuc
 * Created Date: Fri Mar 07 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { IDatabaseConnection } from '@pgtyped/runtime';
import { Pool } from 'pg';

export class PgPoolAdapter implements IDatabaseConnection {
  constructor(private readonly pool: Pool) {}

  async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    const result = await this.pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount === null ? 0 : result.rowCount };
  }
}

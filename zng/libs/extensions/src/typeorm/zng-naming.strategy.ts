/*
 * File Name   : zng-naming.strategy.ts
 * Author      : Michael LeDuc
 * Created Date: Thu Feb 06 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import * as pluralize from 'pluralize';
import { NamingStrategyInterface, Table } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { snakeCase } from 'typeorm/util/StringUtils';

/*
  Inherit from the SnakeNamingStrategy and override the methods that need to be customized
  to conform to Postgres naming conventions

  This Strategy adds the following capabilities to the SnakeNamingStrategy:
  1. Pluralizes the Table name if using the Entity Class name and not providing a specific name
  2. Generates the various constraint (pkey, fkey, key, unique, indexes, default, and exclusion) names that conform to Postgres naming conventions
*/
export class ZngNamingStrategy extends SnakeNamingStrategy implements NamingStrategyInterface {
  constructor() {
    super();
  }

  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName : snakeCase(pluralize.plural(targetName));
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return parseName(tableOrName, columnNames, 'pkey');
  }

  foreignKeyName(tableOrName: Table | string, columnNames: string[], referencedTablePath?: string, referencedColumnNames?: string[]): string {
    // combine referenced table name and fkey to create the suffix
    const suffix = referencedTablePath ? `${referencedTablePath}_fkey` : 'fkey';

    return parseName(tableOrName, columnNames, suffix);
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return parseName(tableOrName, columnNames, 'key');
  }

  indexName(tableOrName: Table | string, columns: string[]): string {
    return parseName(tableOrName, columns, 'idx');
  }
  
  defaultConstraintName(tableOrName: Table | string, columnName: string): string {
    return parseName(tableOrName, [columnName], 'df');
  }

  // Not worth trying to parse an Expression to generate a valid Check Constraint name
  // When using @Check('<constraint_name>', '<expression') -- always specify a Constraint name
  // checkConstraintName(tableOrName: Table | string, expression: string, isEnum?: boolean): string {
  //   return parseName(tableOrName, [expression], 'check');
  // }

  exclusionConstraintName(tableOrName: Table | string, expression: string): string{
    return parseName(tableOrName, [expression], 'excl');  
  }
}

function parseName(tableOrName: Table | string, columnNames: string[], suffix: string, length: number = 63) {
  const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
  const cols = columnNames.join('_');
  const name = `${tableName}_${cols}_${suffix}`.slice(0, length);

  return name;
}

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

  closureJunctionTableName(originalClosureTableName: string): string {
    return parseName(originalClosureTableName, [], 'closure');
  }

  columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string {
    return super.columnName(propertyName, customName || '', embeddedPrefixes);
  }

  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName : snakeCase(pluralize.plural(targetName));
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return parseName(tableOrName, columnNames, 'pkey');
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return super.joinColumnName(relationName, referencedColumnName);
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return super.joinTableColumnName(tableName, propertyName, columnName);
  }

  relationName(propertyName: string): string {
    return super.relationName(propertyName);
  }

  relationConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return super.relationConstraintName(tableOrName, columnNames);
  }

  joinTableInverseColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return super.joinTableInverseColumnName(tableName, propertyName, columnName);
  }

  joinTableColumnDuplicationPrefix(columnName: string, index: number): string {
    return super.joinTableColumnDuplicationPrefix(columnName, index);
  }

  //@Check('loans_borrower_id_ne_lender_id_check', '"borrower_id" <> "lender_id"')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkConstraintName(tableOrName: Table | string, expression: string, _isEnum?: boolean): string {
    return parseName(tableOrName, [expression], 'check');
  }

  joinTableName(firstTableName: string, secondTableName: string, firstPropertyName: string, secondPropertyName: string): string {
    return super.joinTableName(firstTableName, secondTableName, firstPropertyName, secondPropertyName);
  }

  prefixTableName(prefix: string, tableName: string): string {
    return super.prefixTableName(prefix, tableName);
  }

  nestedSetColumnNames = { left: 'nsleft', right: 'nsright' };
  materializedPathColumnName = 'mpath';

  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    referencedTablePath?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _referencedColumnNames?: string[]
  ): string {
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

  exclusionConstraintName(tableOrName: Table | string, expression: string): string {
    return parseName(tableOrName, [expression], 'excl');
  }
}

function parseName(tableOrName: Table | string, columnNames: string[], suffix: string | undefined = undefined, length: number = 63) {
  const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
  const cols = columnNames.join('_');

  // If suffix is undefined, don't add it to the name
  const name = suffix
    ? `${tableName}_${cols}_${suffix}`.slice(0, length)
    : `${tableName}_${cols}`.slice(0, length);

  return name;
}

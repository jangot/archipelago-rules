/*
 * File Name   : typeorm.extensions.ts
 * Author      : Michael LeDuc
 * Created Date: Fri Mar 28 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */


import camelcaseKeys from 'camelcase-keys';
import { QueryRunner } from 'typeorm';

export type PGFunctionParam = { value: string | number | boolean | null, type: 'string' | 'number' | 'boolean' | 'uuid' | 'null' };

/**
 * Calls a Postgres function with the given parameters and returns the result.
 * @param queryRunner - The query runner to use.
 * @param functionName - The name of the Postgres function to call.
 * @param params - The named parameters to pass to the function.
 * @param isArray - Whether the result should be an array. If false, returns a single item.
 * @returns Promise<T | T[]> - Returns either a single item or array of items of type T
 */
export const executePGFunction = async <T>(
  queryRunner: QueryRunner, 
  functionName: string, 
  params: PGFunctionParam[]
): Promise<T[]> => {
  // Create parameter placeholders with direct values
  const paramValues = params.map((param) => {
    if (param.type === 'string') {
      return param.value;
    } else if (param.type === 'number') {
      return param.value;
    } else if (param.type === 'boolean') {  
      return param.value;
    } else if (param.type === 'uuid') {
      return param.value;
    } else if (param.type === 'null') {
      return null;
    }
    return '';
  });
  
  // Create parameter position placeholders (with type - if needed)
  const placeholders = params.map((param, index) => {
    if (param.type === 'string') {
      return `$${index + 1}`;
    } else if (param.type === 'number') {
      return `$${index + 1}`;
    } else if (param.type === 'boolean') {  
      return `$${index + 1}`;
    } else if (param.type === 'uuid') {
      return `$${index + 1}::uuid`;
    } else if (param.type === 'null') {
      return `$${index + 1}`;
    }
    return '';
  }).join(', ');

  // Use SELECT * FROM for functions returning multiple rows
  const queryStr = `SELECT * FROM ${functionName}(${placeholders})`;

  const result = await queryRunner.query(queryStr, paramValues);

  // Need to camel case the result which is snake case
  const camelCaseResult = camelcaseKeys(result, { deep: true }) as T[];

  return Array.isArray(camelCaseResult) ? camelCaseResult : [camelCaseResult];
};

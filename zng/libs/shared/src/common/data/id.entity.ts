/*
 * File Name   : id.entity.ts
 * Author      : Michael LeDuc
 * Created Date: Wed Feb 12 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import { ObjectLiteral } from 'typeorm';

export type SingleIdEntityType = string | number;
export type CompositeIdEntityType = { [key: string]: SingleIdEntityType }; // Ensures all values are string | number

/*
  Defines an Entity that must have either a single PrimaryKey named id that is either a string or number
  or a composite key consisting of multiple string or number properties
  Examples:
  // Single Primary key
  @Entity()
  class User extends EntityId<string> {
    @PrimaryGeneratedColumn()
    id: string;
  }
  or
  // Compound Primary key
  @Entity()
  class User extends EntityId<{ id: string, name: string }> {
    @PrimaryColumn()
    id: string;

    @PrimaryColumn()
    name: string;
  }
*/

export interface EntityId<T extends SingleIdEntityType | CompositeIdEntityType> extends ObjectLiteral {
  id: T;
}

# Migration Build System

This document describes the migration build system that converts SQL migration files to JavaScript files for TypeORM.

## Overview

The migration build system automatically converts SQL migration files from the `db/migrations` directory into JavaScript files compatible with TypeORM, placing them in the `dist/migrations` directory.

## Features

- **Automatic SQL to JavaScript conversion** - Converts SQL queries to TypeORM-compatible JavaScript
- **Flexible file naming** - Supports multiple file naming conventions
- **Comment preservation** - Converts SQL comments to JavaScript comments
- **Timestamp preservation** - Maintains migration timestamps for proper ordering
- **Empty down method generation** - Automatically generates empty down methods when no down file exists

## File Naming Conventions

The system supports three different file naming patterns:

### 1. Complete Up/Down Pairs
```
1754654085280-init-up.sql
1754654085280-init-down.sql
```
- Both files are required
- Creates a complete migration with up and down methods

### 2. Up-Only Files
```
1754654085280-init-up.sql
```
- Only the up file exists
- Generates an empty down method

### 3. Single Files (No Suffix)
```
1754654085280-init.sql
```
- Single file without up/down suffix
- Automatically treated as an up file
- Generates an empty down method

## File Structure

### Input Directory: `db/migrations/`
Contains SQL migration files with various naming patterns.

### Output Directory: `dist/migrations/`
Contains generated JavaScript migration files for TypeORM.

## Generated Migration Structure

Each generated migration follows this structure:

```javascript
"use strict";

/**
 * Migration: InitMigration
 * Timestamp: 1754654085280
 */
class InitMigration {
  /**
   * Migration name
   */
  name = '1754654085280-init';

  /**
   * Executed when applying migration
   */
  async up(queryRunner) {
    // SQL comments are converted to JavaScript comments
    await queryRunner.query(`CREATE TABLE "core"."users" (...)`);
    await queryRunner.query(`CREATE INDEX "users_email_idx" ON "core"."users" ("email");`);
  }

  /**
   * Executed when reverting migration
   */
  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX "core"."users_email_idx";`);
    await queryRunner.query(`DROP TABLE "core"."users";`);
  }
}

module.exports = InitMigration;
```

## Class Naming Convention

- **Class name**: Generated from the migration name without timestamp (PascalCase)
- **Property name**: Contains the full migration name with timestamp
- **Timestamp**: Extracted from the filename for proper ordering

### Examples:
- File: `1754654085280-init-up.sql` → Class: `InitMigration`
- File: `1234567890-create-users-up.sql` → Class: `CreateUsersMigration`
- File: `9876543210-single-file.sql` → Class: `SingleFileMigration`

## Comment Processing

### SQL Comments to JavaScript Comments
```sql
-- Create users table
CREATE TABLE "core"."users" (...);
-- Add index for performance
CREATE INDEX "users_email_idx" ON "core"."users" ("email");
```

Becomes:
```javascript
// Create users table
await queryRunner.query(`CREATE TABLE "core"."users" (...)`);
// Add index for performance
await queryRunner.query(`CREATE INDEX "users_email_idx" ON "core"."users" ("email");`);
```

## Usage

### Command Line
```bash
# Using npm script
npm run build:migrations

# Direct execution
node scripts/build-migrations.js
```

### NPM Script
The system is configured in `package.json`:
```json
{
  "scripts": {
    "build:migrations": "node scripts/build-migrations.js"
  }
}
```
## Troubleshooting

### Common Issues

1. **Missing up file**: Ensure at least one up file exists for each migration
2. **Invalid SQL syntax**: Check SQL files for syntax errors before conversion
3. **Timestamp conflicts**: Ensure unique timestamps for each migration
4. **File permissions**: Ensure read/write permissions for input/output directories

### Error Messages

- `Skipping {migration}: no up file found` - No up file exists for the migration
- `Error converting migrations: {error}` - General conversion error
- `Created file: {path}` - Successful conversion

## File Examples

### Complete Migration Pair
**1754654085280-create-users-up.sql:**
```sql
-- Create users table
CREATE TABLE "core"."users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "email" text NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint
ALTER TABLE "core"."users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
```

**1754654085280-create-users-down.sql:**
```sql
-- Drop constraints first
ALTER TABLE "core"."users" DROP CONSTRAINT "users_email_key";

-- Drop table
DROP TABLE "core"."users";
```

### Single File Migration
**1234567890-simple-migration.sql:**
```sql
-- Simple migration without down file
CREATE TABLE "test"."simple" ("id" serial PRIMARY KEY, "name" text);
INSERT INTO "test"."simple" ("name") VALUES ('test');
```

## Configuration

The system uses the following default paths:
- **Input**: `db/migrations/`
- **Output**: `dist/migrations/`
- **Script**: `scripts/build-migrations.js`

These paths can be modified in the script if needed.

const fs = require('fs');
const path = require('path');

/**
 * Converts SQL migrations to JavaScript files for TypeORM
 */
function convertMigrationsToTypeORM() {
  const migrationsDir = path.join(__dirname, '../db/migrations');
  const outputDir = path.join(__dirname, '../dist/migrations');

    // Create dist/migrations folder if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get list of all files in migrations folder
  const files = fs.readdirSync(migrationsDir);

    // Group files by migration name (without extension)
  const migrationGroups = {};

  files.forEach(file => {
    if (file.endsWith('.sql')) {
      const baseName = file.replace(/\.sql$/, '');
      const isUp = file.includes('-up.sql');
      const isDown = file.includes('-down.sql');

      if (isUp || isDown) {
        // Handle explicit up/down files
        const migrationName = baseName.replace(/-up$/, '').replace(/-down$/, '');

        if (!migrationGroups[migrationName]) {
          migrationGroups[migrationName] = {};
        }

        if (isUp) {
          migrationGroups[migrationName].up = file;
        } else if (isDown) {
          migrationGroups[migrationName].down = file;
        }
      } else {
        // Handle single file without up/down suffix (treat as up)
        const migrationName = baseName;

        if (!migrationGroups[migrationName]) {
          migrationGroups[migrationName] = {};
        }

        // If no up file exists yet, use this file as up
        if (!migrationGroups[migrationName].up) {
          migrationGroups[migrationName].up = file;
        }
      }
    }
  });

  // Convert each migration group
  Object.entries(migrationGroups).forEach(([migrationName, files]) => {
    if (files.up) {
      convertMigrationToTypeORM(migrationName, files.up, files.down, migrationsDir, outputDir);
    } else {
      console.warn(`Skipping ${migrationName}: no up file found`);
    }
  });

  console.log('Migration conversion completed!');
}

/**
 * Converts a single migration to TypeORM format
 */
function convertMigrationToTypeORM(migrationName, upFile, downFile, sourceDir, outputDir) {
  console.log(`Converting migration: ${migrationName}`);

  // Read up file content
  const upContent = fs.readFileSync(path.join(sourceDir, upFile), 'utf8');

  // Read down file content if it exists, otherwise use empty string
  let downContent = '';
  if (downFile) {
    downContent = fs.readFileSync(path.join(sourceDir, downFile), 'utf8');
  }

  // Extract timestamp from filename
  const timestamp = migrationName.split('-')[0];

  // Create migration class name and full name
  const className = generateClassName(migrationName);
  const fullMigrationName = generateMigrationName(migrationName);

  // Generate JavaScript code for TypeORM migration
  const jsContent = generateTypeORMMigration(timestamp, className, fullMigrationName, upContent, downContent);

  // Write file
  const outputFile = path.join(outputDir, `${migrationName}.js`);
  fs.writeFileSync(outputFile, jsContent);

  console.log(`Created file: ${outputFile}`);
}

/**
 * Generates class name for migration (without timestamp)
 */
function generateClassName(migrationName) {
  // Remove timestamp and convert kebab-case to PascalCase
  const nameWithoutTimestamp = migrationName.replace(/^\d+/, '');

  if (!nameWithoutTimestamp) {
    return 'Migration';
  }

  return nameWithoutTimestamp
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Migration';
}

/**
 * Generates full migration name with timestamp
 */
function generateMigrationName(migrationName) {
  return migrationName;
}

/**
 * Generates JavaScript code for TypeORM migration
 */
function generateTypeORMMigration(timestamp, className, migrationName, upSQL, downSQL) {
  // Process SQL queries and comments
  const upQueries = processSQLWithComments(upSQL);
  const downQueries = processSQLWithComments(downSQL);

  return `"use strict";

/**
 * Migration: ${className}
 * Timestamp: ${timestamp}
 */
class ${className} {
  /**
   * Migration name
   */
  name = '${migrationName}';

  /**
   * Executed when applying migration
   */
  async up(queryRunner) {
${upQueries.join('\n')}
  }

  /**
   * Executed when reverting migration
   */
  async down(queryRunner) {
${downQueries.join('\n')}
  }
}

module.exports = ${className};
`;
}

/**
 * Processes SQL content and converts comments to JavaScript format
 */
function processSQLWithComments(sqlContent) {
  const lines = sqlContent.split('\n');
  const result = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      continue; // Skip empty lines
    }

    // Check if line starts with SQL comment (--)
    if (trimmedLine.startsWith('--')) {
      // Convert SQL comment to JavaScript comment
      const comment = trimmedLine.substring(2).trim();
      result.push(`    // ${comment}`);
    } else {
      // Regular SQL query
      const escapedLine = trimmedLine.replace(/`/g, '\\`');
      result.push(`    await queryRunner.query(\`${escapedLine}\`);`);
    }
  }

  return result;
}

// Run conversion
if (require.main === module) {
  try {
    convertMigrationsToTypeORM();
  } catch (error) {
    console.error('Error converting migrations:', error);
    process.exit(1);
  }
}

module.exports = { convertMigrationsToTypeORM };

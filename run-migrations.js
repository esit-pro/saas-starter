#!/usr/bin/env node

/**
 * Script to run SQL migrations to add audit fields
 * Run with: node run-migrations.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, 'lib', 'db', 'migrations');
const MIGRATION_FILE = path.join(MIGRATIONS_DIR, 'add_missing_audit_fields.sql');

function parsePostgresUrl(url) {
  try {
    // Extract connection details from postgres://user:password@host:port/database
    const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const matches = url.match(regex);
    
    if (!matches || matches.length < 6) {
      throw new Error('Invalid Postgres URL format');
    }
    
    return {
      user: matches[1],
      password: matches[2],
      host: matches[3],
      port: matches[4],
      database: matches[5]
    };
  } catch (error) {
    console.error('Error parsing Postgres URL:', error.message);
    return null;
  }
}

function runMigration() {
  try {
    console.log('Running migration to add audit fields...');
    
    // Check if the migration file exists
    if (!fs.existsSync(MIGRATION_FILE)) {
      console.error('Migration file not found:', MIGRATION_FILE);
      process.exit(1);
    }
    
    // Get database connection info from POSTGRES_URL in .env
    let dbConfig = {
      host: 'localhost',
      user: 'postgres',
      database: 'saas_starter',
      port: 5432
    };
    
    if (process.env.POSTGRES_URL) {
      console.log('Using PostgreSQL connection from POSTGRES_URL');
      const parsedConfig = parsePostgresUrl(process.env.POSTGRES_URL);
      if (parsedConfig) {
        dbConfig = parsedConfig;
      }
    } else {
      console.warn('POSTGRES_URL not found in .env, using default connection values');
    }
    
    // Create a temporary .pgpass file for password authentication
    const pgpassContent = `${dbConfig.host}:${dbConfig.port}:${dbConfig.database}:${dbConfig.user}:${dbConfig.password}`;
    const pgpassFile = path.join(__dirname, '.pgpass_temp');
    fs.writeFileSync(pgpassFile, pgpassContent, { mode: 0o600 });
    
    // Set PGPASSFILE environment variable
    process.env.PGPASSFILE = pgpassFile;
    
    // Run the migration
    console.log(`Executing migration on ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} as ${dbConfig.user}`);
    const result = execSync(
      `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${MIGRATION_FILE}`,
      { env: { ...process.env } }
    ).toString();
    
    // Clean up .pgpass file
    fs.unlinkSync(pgpassFile);
    
    console.log('Migration result:');
    console.log(result);
    
    console.log('Migration completed successfully.');
    console.log('You can now verify the audit fields with: node verify-audit-fields.js');
    
  } catch (error) {
    console.error('Error running migration:', error.message);
    if (error.stdout) console.error('stdout:', error.stdout.toString());
    if (error.stderr) console.error('stderr:', error.stderr.toString());
    
    // Clean up .pgpass file if it exists
    const pgpassFile = path.join(__dirname, '.pgpass_temp');
    if (fs.existsSync(pgpassFile)) {
      fs.unlinkSync(pgpassFile);
    }
    
    process.exit(1);
  }
}

// Run the function
runMigration(); 
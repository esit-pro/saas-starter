#!/usr/bin/env node

/**
 * Script to verify that all database tables have proper audit fields.
 * Run with: node verify-audit-fields.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Tables that should have audit fields
const tables = [
  'users',
  'teams',
  'team_members',
  'clients',
  'service_tickets',
  'ticket_comments',
  'time_entries',
  'expenses',
  'invitations',
  'verification_codes',
  'invoices',
  'invoice_items',
  'invoice_tickets'
];

// Required audit fields
const requiredFields = [
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
  'deleted_by'
];

// Connect to the database and retrieve table information
function checkTablesAuditFields() {
  try {
    console.log('Checking tables for audit fields...\n');
    
    // Create a temporary SQL file
    const sqlQuery = `
      SELECT 
        table_name, 
        string_agg(column_name, ', ') as columns
      FROM 
        information_schema.columns
      WHERE 
        table_name IN (${tables.map(t => `'${t}'`).join(',')})
        AND table_schema = 'public'
      GROUP BY 
        table_name
      ORDER BY 
        table_name;
    `;
    
    fs.writeFileSync('temp-query.sql', sqlQuery);
    
    // Execute the query
    const result = execSync('psql -h localhost -U postgres -d saas_starter -f temp-query.sql').toString();
    
    // Clean up
    fs.unlinkSync('temp-query.sql');
    
    // Parse the result
    const lines = result.split('\n');
    const tableData = {};
    
    let currentTable = null;
    let columnsStarted = false;
    let collectingColumns = false;
    
    // Skip the header lines and collect table column data
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('-')) {
        continue; // Skip separator lines
      }
      
      if (line === '') {
        collectingColumns = false;
        continue;
      }
      
      if (collectingColumns) {
        // This is a continuation of columns for the current table
        tableData[currentTable] += line;
      } else {
        // This is a new table row
        const parts = line.split('|');
        if (parts.length >= 2) {
          currentTable = parts[0].trim();
          tableData[currentTable] = parts[1].trim();
          collectingColumns = true;
        }
      }
    }
    
    // Check each table for required fields
    console.log('Audit field status for each table:');
    console.log('=================================');
    
    let allTablesValid = true;
    
    tables.forEach(table => {
      const columns = tableData[table] ? tableData[table].split(', ').map(c => c.trim()) : [];
      const missingFields = requiredFields.filter(field => !columns.includes(field));
      
      if (missingFields.length > 0) {
        console.log(`❌ ${table}: Missing fields: ${missingFields.join(', ')}`);
        allTablesValid = false;
      } else {
        console.log(`✅ ${table}: All audit fields present`);
      }
    });
    
    console.log('\nSummary:');
    if (allTablesValid) {
      console.log('✅ All tables have the required audit fields.');
    } else {
      console.log('❌ Some tables are missing audit fields.');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  }
}

// Run the function
checkTablesAuditFields(); 
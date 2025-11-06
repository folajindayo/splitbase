#!/usr/bin/env node

/**
 * Database Migration Validator
 * Validates that all required migrations are present and in correct format
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_MIGRATIONS = [
  'supabase-migration.sql',
  'supabase-escrow-migration.sql',
  'supabase-escrow-custody-migration.sql',
  'supabase-custody-audit-migration.sql',
  'supabase-rate-limit-migration.sql',
  'supabase-notifications-migration.sql',
];

const REQUIRED_TABLES = {
  'supabase-migration.sql': ['splits', 'recipients'],
  'supabase-escrow-migration.sql': ['escrows', 'escrow_milestones', 'escrow_activities'],
  'supabase-escrow-custody-migration.sql': ['custody_wallet_address', 'encrypted_private_key'],
  'supabase-custody-audit-migration.sql': ['custody_audit_logs'],
  'supabase-rate-limit-migration.sql': ['custody_rate_limits'],
  'supabase-notifications-migration.sql': ['custody_notifications'],
};

console.log('=====================================');
console.log('  Database Migration Validator');
console.log('=====================================\n');

let allValid = true;
let errors = [];
let warnings = [];

// Check if all required migrations exist
console.log('1. Checking migration files...');
REQUIRED_MIGRATIONS.forEach((migration) => {
  const filePath = path.join(__dirname, '..', migration);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${migration}`);
  } else {
    console.log(`   ✗ ${migration} - MISSING`);
    errors.push(`Missing migration file: ${migration}`);
    allValid = false;
  }
});
console.log('');

// Validate migration content
console.log('2. Validating migration content...');
REQUIRED_MIGRATIONS.forEach((migration) => {
  const filePath = path.join(__dirname, '..', migration);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const requiredElements = REQUIRED_TABLES[migration];
    
    if (requiredElements) {
      requiredElements.forEach((element) => {
        if (content.includes(element)) {
          console.log(`   ✓ ${migration} contains "${element}"`);
        } else {
          console.log(`   ⚠ ${migration} missing "${element}"`);
          warnings.push(`${migration} might be missing "${element}"`);
        }
      });
    }
  }
});
console.log('');

// Check for common SQL patterns
console.log('3. Checking SQL patterns...');
REQUIRED_MIGRATIONS.forEach((migration) => {
  const filePath = path.join(__dirname, '..', migration);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for CREATE TABLE statements
    const createTableCount = (content.match(/CREATE TABLE/gi) || []).length;
    console.log(`   ✓ ${migration}: ${createTableCount} CREATE TABLE statements`);
    
    // Check for indexes
    const indexCount = (content.match(/CREATE INDEX/gi) || []).length;
    if (indexCount > 0) {
      console.log(`   ✓ ${migration}: ${indexCount} indexes`);
    }
    
    // Check for RLS
    if (content.includes('ENABLE ROW LEVEL SECURITY')) {
      console.log(`   ✓ ${migration}: RLS enabled`);
    } else {
      warnings.push(`${migration} doesn't enable RLS`);
    }
  }
});
console.log('');

// Check environment setup
console.log('4. Checking environment setup...');
const envPath = path.join(__dirname, '..', 'app', '.env.local');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env.local exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for critical variables
  const criticalVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ESCROW_ENCRYPTION_KEY',
  ];
  
  criticalVars.forEach((varName) => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
      console.log(`   ✓ ${varName} is set`);
    } else {
      warnings.push(`${varName} needs to be configured in .env.local`);
    }
  });
} else {
  warnings.push('.env.local not found - run setup-custody.sh first');
}
console.log('');

// Summary
console.log('=====================================');
console.log('  Validation Summary');
console.log('=====================================\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All validations passed!');
  console.log('\nYou can now run these migrations in Supabase SQL Editor.');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach((error) => console.log(`   - ${error}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach((warning) => console.log(`   - ${warning}`));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('Please fix the errors before running migrations.');
    process.exit(1);
  } else {
    console.log('Warnings found but validation passed.');
    console.log('Review warnings and proceed with caution.');
    process.exit(0);
  }
}


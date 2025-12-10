/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and provides detailed diagnostics.
 * Run with: node scripts/testDbConnection.js
 */

require('dotenv').config();
const { testConnection, sequelize } = require('../config/database');

async function test() {
  console.log('\n🧪 Database Connection Test\n');
  console.log('='.repeat(50));
  
  try {
    await testConnection();
    console.log('\n✅ SUCCESS: Database connection is working!\n');
    
    // Test a simple query
    try {
      const [results] = await sequelize.query('SELECT version() as version, current_database() as database, current_user as user');
      console.log('📊 Database Info:');
      console.log(`   PostgreSQL Version: ${results[0].version.split(' ')[0]} ${results[0].version.split(' ')[1]}`);
      console.log(`   Current Database: ${results[0].database}`);
      console.log(`   Current User: ${results[0].user}`);
    } catch (queryError) {
      console.warn('⚠️  Could not execute test query:', queryError.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED: Database connection test failed\n');
    process.exit(1);
  }
}

test();


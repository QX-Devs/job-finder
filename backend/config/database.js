//The main ORM (Object-Relational Mapping) library for Node.js
const { Sequelize } = require('sequelize');

// Database configuration
const DB_CONNECTION_STRING = 'postgresql://postgres.jxgvmimpmfyllbvmmgey:.y5.9PvP$FUmf7y@aws-1-eu-north-1.pooler.supabase.com:6543/postgres';

console.log('🔍 Database Configuration:');
console.log('   Host: aws-1-eu-north-1.pooler.supabase.com');
console.log('   Port: 6543');
console.log('   Database: postgres');
console.log('   User: postgres.jxgvmimpmfyllbvmmgey');
console.log('   Password: ***');

const sequelize = new Sequelize(DB_CONNECTION_STRING, {
    dialect: 'postgres',
    logging: false,

    pool: {
      max: 5,         // Max connections
      min: 0,         // Min connections
      acquire: 30000, // 30s timeout
      idle: 10000     // 10s idle
    },

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // ✅ REQUIRED for Supabase
      },
      connectTimeout: 10000
    },

    retry: {
      max: 2
    }
  }
);


// Test connection
const testConnection = async () => {
  try {
    console.log('🔄 Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('\n❌ Unable to connect to the database');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.original?.code || error.code,
      errno: error.original?.errno || error.errno,
      syscall: error.original?.syscall || error.syscall,
      address: error.original?.address || error.address,
      port: error.original?.port || error.port
    });
    
    // Provide helpful troubleshooting tips
    console.error('\n🔧 Troubleshooting tips:');
    
    if (error.original?.code === 'ETIMEDOUT' || error.code === 'ETIMEDOUT') {
      console.error('   ⏱️  Connection timeout - The database server is not responding');
      console.error('   → Check firewall settings and network connectivity');
    } else if (error.original?.code === 'ECONNREFUSED' || error.code === 'ECONNREFUSED') {
      console.error('   🚫 Connection refused - The database server rejected the connection');
      console.error('   → Verify PostgreSQL is running and listening on the specified port');
    } else if (error.original?.code === 'ENOTFOUND' || error.code === 'ENOTFOUND') {
      console.error('   🔍 Host not found - Cannot resolve the database hostname');
      console.error('   → Check DNS resolution and network connectivity');
    } else if (error.original?.code === '28P01' || error.message.includes('password authentication')) {
      console.error('   🔐 Authentication failed - Invalid username or password');
      console.error('   → Verify database credentials');
    } else if (error.original?.code === '3D000' || error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('   📁 Database does not exist');
      console.error('   → Verify database name is correct');
    } else {
      console.error('   → Check database connection string');
      console.error('   → Check PostgreSQL server logs for more details');
    }
    
    // Re-throw the error so caller can handle it
    throw error;
  }
};

module.exports = { sequelize, testConnection };

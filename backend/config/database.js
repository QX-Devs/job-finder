//The main ORM (Object-Relational Mapping) library for Node.js
import { Sequelize } from 'sequelize';
import 'dotenv/config';



const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,        // Maximum 5 taxis available at once
      min: 0,        // Can have zero taxis waiting when quiet
      acquire: 30000, // Wait max 30 seconds for a taxi (TIMEOUT)
      idle: 10000    // Taxis wait 10 seconds, then leave if no customers
    }
  }
);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};


export { sequelize, testConnection };

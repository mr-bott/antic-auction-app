// config/dbConfig.js
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    logger.info('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    logger.error('Database connection failed:', err);
  });

module.exports = pool;
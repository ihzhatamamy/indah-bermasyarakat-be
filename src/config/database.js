const knex = require('knex');
const config = require('./config');

const db = knex({
  client: 'mysql2',
  connection: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
});

const connectDB = async () => {
  try {
    await db.raw('SELECT 1');
    console.log(`📦 MySQL Connected: ${config.DB_HOST}:${config.DB_PORT}`);
    return db;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB, db };
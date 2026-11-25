import 'dotenv/config';
import mysql from 'mysql2/promise.js';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loyalty_saas',
  socketPath: process.env.DB_SOCKET_PATH || undefined,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 20,
  queueLimit: 0
});

pool.setMaxListeners(0);

export default pool;

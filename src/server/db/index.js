import 'dotenv/config';
import {Pool} from 'pg';





const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("connect", () => console.log("Connected to PostgreSQL"));

export const query = (text, params) => pool.query(text, params);

export default pool;

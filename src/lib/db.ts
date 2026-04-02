import mysql from "mysql2/promise";

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

if (!host || !user || password === undefined || password === "" || !database) {
  throw new Error(
    "Missing DB env: set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in .env.local"
  );
}

// Cloud SQL "SSL required" / ENCRYPTED_ONLY: enable TLS without verifying the
// server cert (fine for dev). Set DB_SSL=true in .env.local if connections fail
// or if the console shows SSL/TLS required for this instance.
const useSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export default pool;

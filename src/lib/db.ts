import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

function createPool() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || password === undefined || password === "" || !database) {
    throw new Error(
      "Missing DB env: set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in your local env file or Cloud Run service environment"
    );
  }

  // Cloud SQL "SSL required" / ENCRYPTED_ONLY: enable TLS without verifying the
  // server cert (fine for dev). Set DB_SSL=true in .env.local if connections fail
  // or if the console shows SSL/TLS required for this instance.
  const useSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";
  const connectionTarget = host.startsWith("/cloudsql/")
    ? { socketPath: host }
    : { host, port: Number(process.env.DB_PORT) || 3306 };

  return mysql.createPool({
    ...connectionTarget,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Avoid PROTOCOL_CONNECTION_LOST when Cloud SQL / Auth Proxy closes idle TCP
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 15_000,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

function getPool() {
  pool ??= createPool();
  return pool;
}

const lazyPool = new Proxy({} as mysql.Pool, {
  get(_target, property) {
    const dbPool = getPool();
    const value = dbPool[property as keyof mysql.Pool];

    return typeof value === "function" ? value.bind(dbPool) : value;
  },
});

export default lazyPool;

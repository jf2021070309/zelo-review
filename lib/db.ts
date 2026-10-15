import mysql, { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const globalForDb = globalThis as unknown as {
  dbPool: Pool | undefined;
};

function getPoolConfig() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && (dbUrl.startsWith("mysql://") || dbUrl.startsWith("mariadb://"))) {
    try {
      const parsed = new URL(dbUrl);
      return {
        host: parsed.hostname || "127.0.0.1",
        port: parsed.port ? parseInt(parsed.port, 10) : 3306,
        user: decodeURIComponent(parsed.username || "zelo"),
        password: decodeURIComponent(parsed.password || "zelo_secure_pass_2026"),
        database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : "zelo_db",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        namedPlaceholders: false,
      };
    } catch (err) {
      console.warn("Error parsing DATABASE_URL, falling back to standard envs:", err);
    }
  }

  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || "3306", 10),
    user: process.env.MYSQL_USER || process.env.DB_USER || "zelo",
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "zelo_secure_pass_2026",
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "zelo_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    namedPlaceholders: false,
  };
}

export const pool: Pool =
  globalForDb.dbPool ?? mysql.createPool(getPoolConfig());

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = pool;
}

/**
 * Ejecuta una consulta SQL y retorna las filas resultantes como array.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query<RowDataPacket[] & T[]>(sql, params);
  return rows as T[];
}

/**
 * Ejecuta una consulta SQL y retorna una única fila o null.
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Ejecuta un INSERT, UPDATE o DELETE y retorna el resultado de cabecera.
 */
export async function execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

export default pool;

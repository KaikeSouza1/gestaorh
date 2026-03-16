import { Pool } from "pg";

// Essa configuração obriga o código a usar a URL completa que está na Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // O ssl: { rejectUnauthorized: false } às vezes é necessário em bancos na nuvem/externos
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export default pool;
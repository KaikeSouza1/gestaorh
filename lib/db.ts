import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "❌ DATABASE_URL não definida. Configure a variável de ambiente antes de iniciar."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  // Pool sizing — ajuste conforme o plano do seu Postgres
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Testa a conexão ao inicializar (só loga, não derruba o servidor)
pool.on("error", (err) => {
  console.error("Erro inesperado no pool do Postgres:", err.message);
});

export default pool;
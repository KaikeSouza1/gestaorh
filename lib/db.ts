import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Isso diz ao Node.js para aceitar o certificado autoassinado do seu servidor
  }
});

export default pool;
import { Pool } from "pg";

// OPÇÃO NUCLEAR: URL chumbada direto no código.
// (O %40 é o seu '@' da senha para a URL não bugar)
const pool = new Pool({
  connectionString: "postgresql://pedroso:ped%40246618@177.73.253.55:19844/dev_denuncias",
  ssl: false 
});

export default pool;
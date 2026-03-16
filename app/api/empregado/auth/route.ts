import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Puxa a conexão do Postgres que criamos antes
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { acao, cpf, senha, cnpj } = body;

    // Remove pontos e traços para salvar limpo no banco
    const cpfLimpo = cpf.replace(/\D/g, "");
    
    // Criptografa a senha para não salvar em texto puro
    const senhaHash = crypto.createHash("sha256").update(senha).digest("hex");

    if (acao === "registrar") {
      const cnpjLimpo = cnpj.replace(/\D/g, "");

      // 1. Valida se a empresa existe pelo CNPJ
      const empresaRes = await pool.query("SELECT id FROM empresa WHERE cnpj = $1", [cnpjLimpo]);
      if (empresaRes.rowCount === 0) {
        return NextResponse.json({ erro: "Nenhuma empresa cadastrada com este CNPJ." }, { status: 404 });
      }
      const empresaId = empresaRes.rows[0].id;

      // 2. Tenta inserir o empregado vinculado à empresa
      try {
        const insertRes = await pool.query(
          "INSERT INTO empregado (empresa_id, cpf, senha_hash) VALUES ($1, $2, $3) RETURNING id",
          [empresaId, cpfLimpo, senhaHash]
        );
        return NextResponse.json({ sucesso: true, id: insertRes.rows[0].id, empresa_id: empresaId });
      } catch (err: any) {
        if (err.code === "23505") { // Código do Postgres para Unique Violation
          return NextResponse.json({ erro: "Este CPF já possui cadastro." }, { status: 400 });
        }
        throw err;
      }
    } 
    
    else if (acao === "login") {
      // Busca o empregado confirmando CPF e Senha
      const empRes = await pool.query(
        "SELECT id, empresa_id FROM empregado WHERE cpf = $1 AND senha_hash = $2",
        [cpfLimpo, senhaHash]
      );

      if (empRes.rowCount === 0) {
        return NextResponse.json({ erro: "CPF ou Senha incorretos." }, { status: 401 });
      }

      return NextResponse.json({ sucesso: true, id: empRes.rows[0].id, empresa_id: empRes.rows[0].empresa_id });
    }

    return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });

  } catch (error) {
    console.error("Erro na API Auth:", error);
    return NextResponse.json({ erro: "Erro interno no servidor." }, { status: 500 });
  }
}
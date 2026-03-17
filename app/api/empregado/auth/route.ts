import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { acao, usuario, senha, cnpj } = body;
    
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

      // 2. Tenta inserir o empregado vinculado à empresa usando o "usuario" (identificador)
      try {
        const insertRes = await pool.query(
          "INSERT INTO empregado (empresa_id, usuario, senha_hash) VALUES ($1, $2, $3) RETURNING id",
          [empresaId, usuario, senhaHash]
        );
        return NextResponse.json({ sucesso: true, id: insertRes.rows[0].id, empresa_id: empresaId });
      } catch (err: any) {
        if (err.code === "23505") { // Código do Postgres para Unique Violation
          return NextResponse.json({ erro: "Este nome de usuário já está em uso. Tente outro." }, { status: 400 });
        }
        throw err;
      }
    } 
    
    else if (acao === "login") {
      // Busca o empregado confirmando o Usuário e Senha
      const empRes = await pool.query(
        "SELECT id, empresa_id FROM empregado WHERE usuario = $1 AND senha_hash = $2",
        [usuario, senhaHash]
      );

      if (empRes.rowCount === 0) {
        return NextResponse.json({ erro: "Usuário ou Senha incorretos." }, { status: 401 });
      }

      return NextResponse.json({ sucesso: true, id: empRes.rows[0].id, empresa_id: empRes.rows[0].empresa_id });
    }

    return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });

  } catch (error) {
    console.error("Erro na API Auth:", error);
    return NextResponse.json({ erro: "Erro interno no servidor." }, { status: 500 });
  }
}
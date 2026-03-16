import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cnpj, nome, email, senha } = body;

    const cnpjLimpo = cnpj.replace(/\D/g, "");
    const senhaHash = crypto.createHash("sha256").update(senha).digest("hex");

    // 1. Verifica se a empresa existe
    const empresaRes = await pool.query("SELECT id FROM empresa WHERE cnpj = $1", [cnpjLimpo]);
    
    if (empresaRes.rowCount === 0) {
      return NextResponse.json({ erro: "CNPJ não encontrado. Cadastre a empresa primeiro no banco." }, { status: 404 });
    }

    const empresaId = empresaRes.rows[0].id;

    // 2. Insere o funcionário do RH
    await pool.query(
      "INSERT INTO funcionario_rh (empresa_id, nome, email, senha_hash) VALUES ($1, $2, $3, $4)",
      [empresaId, nome, email, senhaHash]
    );

    return NextResponse.json({ sucesso: true });

  } catch (error: any) {
    if (error.code === '23505') {
        return NextResponse.json({ erro: "Este e-mail já está cadastrado." }, { status: 400 });
    }
    return NextResponse.json({ erro: "Erro interno no servidor." }, { status: 500 });
  }
}
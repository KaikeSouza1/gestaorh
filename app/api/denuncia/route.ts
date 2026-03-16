import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { empresa_id, empregado_id, categoria, descricao, contato_opc } = body;

    // 1. Gera um protocolo aleatório bonito (Ex: #A8B29X)
    const protocolo = '#' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 2. A MÁGICA DA CRIPTOGRAFIA (Cria o Hash irreversível do autor)
    const segredo = process.env.SEGREDO_CRIPTO_DENUNCIAS || "fallback_secret";
    const autorHash = crypto.createHmac("sha256", segredo)
                            .update(empregado_id)
                            .digest("hex");

    // 3. Salva no banco (Note que o empregado_id NÃO VAI PARA O BANCO, só o Hash!)
    const insertRes = await pool.query(
      `INSERT INTO denuncia (empresa_id, protocolo, categoria, descricao, contato_opc, autor_hash) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING protocolo`,
      [empresa_id, protocolo, categoria, descricao, contato_opc || null, autorHash]
    );

    return NextResponse.json({ sucesso: true, protocolo: insertRes.rows[0].protocolo });

  } catch (error) {
    console.error("Erro na API de Denúncia:", error);
    return NextResponse.json({ erro: "Erro interno ao registrar denúncia." }, { status: 500 });
  }
}
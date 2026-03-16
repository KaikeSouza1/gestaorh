import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { empresa_id, empregado_id } = body;

    // 1. Recalcula o Hash usando o segredo do servidor
    const segredo = process.env.SEGREDO_CRIPTO_DENUNCIAS || "fallback_secret";
    const autorHash = crypto.createHmac("sha256", segredo)
                            .update(empregado_id)
                            .digest("hex");

    // 2. Busca apenas as denúncias desta empresa E deste Hash específico
    const res = await pool.query(
      `SELECT protocolo, categoria, descricao, status, parecer_rh, criado_em 
       FROM denuncia 
       WHERE empresa_id = $1 AND autor_hash = $2 
       ORDER BY criado_em DESC`,
      [empresa_id, autorHash]
    );

    return NextResponse.json({ sucesso: true, denuncias: res.rows });

  } catch (error) {
    console.error("Erro na API de Histórico:", error);
    return NextResponse.json({ erro: "Erro ao buscar o histórico." }, { status: 500 });
  }
}
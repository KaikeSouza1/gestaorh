export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const denuncia_id = searchParams.get("denuncia_id");

    const res = await pool.query(
      "SELECT * FROM mensagem_denuncia WHERE denuncia_id = $1 ORDER BY criado_em ASC", 
      [denuncia_id]
    );
    
    return NextResponse.json(res.rows, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao buscar chat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { denuncia_id, remetente, texto } = await request.json();
    
    await pool.query(
      "INSERT INTO mensagem_denuncia (denuncia_id, remetente, texto) VALUES ($1, $2, $3)", 
      [denuncia_id, remetente, texto]
    );
    
    return NextResponse.json({ sucesso: true });
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
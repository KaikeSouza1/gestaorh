import { NextResponse } from "next/server";
import pool from "@/lib/db";

// BUSCAR AS MENSAGENS DE UM PROTOCOLO
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const denuncia_id = searchParams.get("denuncia_id");

    const res = await pool.query(
      "SELECT * FROM mensagem_denuncia WHERE denuncia_id = $1 ORDER BY criado_em ASC", 
      [denuncia_id]
    );
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao buscar chat." }, { status: 500 });
  }
}

// ENVIAR UMA NOVA MENSAGEM
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
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const protocolo = searchParams.get("protocolo");

    // Procura as mensagens cruzando a tabela com o Protocolo
    const res = await pool.query(
      `SELECT m.* FROM mensagem_denuncia m
       JOIN denuncia d ON m.denuncia_id = d.id
       WHERE d.protocolo = $1 ORDER BY m.criado_em ASC`, 
      [protocolo]
    );
    
    return NextResponse.json(res.rows, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao buscar chat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { protocolo, remetente, texto } = await request.json();
    
    // Descobre qual é o ID real da denúncia usando o protocolo
    const denRes = await pool.query("SELECT id FROM denuncia WHERE protocolo = $1", [protocolo]);
    
    if (denRes.rowCount === 0) {
      return NextResponse.json({ erro: "Protocolo não encontrado" }, { status: 404 });
    }

    const denuncia_id = denRes.rows[0].id;

    // Salva a mensagem
    await pool.query(
      "INSERT INTO mensagem_denuncia (denuncia_id, remetente, texto) VALUES ($1, $2, $3)", 
      [denuncia_id, remetente, texto]
    );
    
    return NextResponse.json({ sucesso: true });
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
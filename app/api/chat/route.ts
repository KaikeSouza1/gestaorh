export const dynamic = 'force-dynamic';
// REMOVIDO: revalidate = 0 conflitava com force-dynamic no Vercel

import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Headers que forçam o Vercel/CDN a NUNCA cachear esta rota
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store', // Específico para Vercel/CDN
  'Vary': '*',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const protocolo = searchParams.get("protocolo");

    if (!protocolo) {
      return NextResponse.json(
        { erro: "Protocolo não informado." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const res = await pool.query(
      `SELECT m.* FROM mensagem_denuncia m
       JOIN denuncia d ON m.denuncia_id = d.id
       WHERE d.protocolo = $1 ORDER BY m.criado_em ASC`,
      [protocolo]
    );

    return NextResponse.json(res.rows, {
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("Erro GET /api/chat:", error);
    return NextResponse.json(
      { erro: "Erro ao buscar chat." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { protocolo, remetente, texto } = await request.json();

    if (!protocolo || !remetente || !texto?.trim()) {
      return NextResponse.json(
        { erro: "Dados incompletos." },
        { status: 400 }
      );
    }

    // Descobre qual é o ID real da denúncia usando o protocolo
    const denRes = await pool.query(
      "SELECT id FROM denuncia WHERE protocolo = $1",
      [protocolo]
    );

    if (denRes.rowCount === 0) {
      return NextResponse.json(
        { erro: "Protocolo não encontrado" },
        { status: 404 }
      );
    }

    const denuncia_id = denRes.rows[0].id;

    // Salva a mensagem
    await pool.query(
      "INSERT INTO mensagem_denuncia (denuncia_id, remetente, texto) VALUES ($1, $2, $3)",
      [denuncia_id, remetente, texto.trim()]
    );

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro POST /api/chat:", error);
    return NextResponse.json(
      { erro: "Erro ao enviar mensagem." },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const empresa_id = searchParams.get("empresa_id");
  const categoria = searchParams.get("categoria");
  const status = searchParams.get("status");
  const busca = searchParams.get("busca");
  const mostrarArquivados = searchParams.get("arquivados") === "true";

  if (!empresa_id) return NextResponse.json({ erro: "Empresa não identificada" }, { status: 400 });

  try {
    let query = `SELECT * FROM denuncia WHERE empresa_id = $1 AND arquivado = $2`;
    const params: any[] = [empresa_id, mostrarArquivados];

    if (categoria) {
      params.push(categoria);
      query += ` AND categoria = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (busca) {
      params.push(`%${busca}%`);
      query += ` AND (protocolo ILIKE $${params.length} OR descricao ILIKE $${params.length})`;
    }

    query += ` ORDER BY criado_em DESC`;
    
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDENTE') as pendentes,
        COUNT(*) FILTER (WHERE prioridade = 'ALTA' AND status != 'RESOLVIDO') as criticos,
        COUNT(*) FILTER (WHERE categoria = 'assedio_politico') as politicos
       FROM denuncia WHERE empresa_id = $1 AND arquivado = false`, [empresa_id]
    );

    const lista = await pool.query(query, params);
    return NextResponse.json({ stats: stats.rows[0], lista: lista.rows });
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { denuncia_id, status, parecer, prioridade, arquivado } = body;

    await pool.query(
      `UPDATE denuncia SET 
        status = COALESCE($1, status), 
        parecer_rh = COALESCE($2, parecer_rh), 
        prioridade = COALESCE($3, prioridade),
        arquivado = COALESCE($4, arquivado),
        atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $5`,
      [status, parecer, prioridade, arquivado, denuncia_id]
    );

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao atualizar" }, { status: 500 });
  }
}
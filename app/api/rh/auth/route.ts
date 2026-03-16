import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cnpj, senha } = body;

    // --- CHECK MASTER (LAERTE) ---
    // Verificamos o texto bruto antes de limpar os números
    if (cnpj.toUpperCase() === "LAERTE" && senha === "246618") {
      return NextResponse.json({ 
        sucesso: true, 
        isMaster: true,
        nome: "Laerte Master" 
      });
    }

    // --- FLUXO NORMAL DE RH ---
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    const senhaHash = crypto.createHash("sha256").update(senha).digest("hex");

    const empresaRes = await pool.query("SELECT id, razao_social FROM empresa WHERE cnpj = $1", [cnpjLimpo]);
    if (empresaRes.rowCount === 0) {
      return NextResponse.json({ erro: "Empresa não encontrada." }, { status: 404 });
    }

    const empresaId = empresaRes.rows[0].id;
    const rhRes = await pool.query(
      "SELECT id, nome FROM funcionario_rh WHERE empresa_id = $1 AND senha_hash = $2",
      [empresaId, senhaHash]
    );

    if (rhRes.rowCount === 0) {
      return NextResponse.json({ erro: "Senha incorreta para esta empresa." }, { status: 401 });
    }

    return NextResponse.json({ 
      sucesso: true, 
      isMaster: false, // Não é master, é RH comum
      rh_id: rhRes.rows[0].id, 
      nome: rhRes.rows[0].nome,
      empresa_id: empresaId,
      razao_social: empresaRes.rows[0].razao_social
    });

  } catch (error) {
    return NextResponse.json({ erro: "Erro interno no servidor." }, { status: 500 });
  }
}
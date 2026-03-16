import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";
import { criarSessao } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cnpj, senha } = body;

    if (!cnpj || !senha) {
      return NextResponse.json(
        { erro: "CNPJ e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // ── Check Master (credenciais vêm das variáveis de ambiente) ──────────
    const masterUsuario = process.env.MASTER_USUARIO;
    const masterSenha = process.env.MASTER_SENHA;

    if (!masterUsuario || !masterSenha) {
      console.error("MASTER_USUARIO ou MASTER_SENHA não configurados.");
    }

    if (
      masterUsuario &&
      masterSenha &&
      cnpj.toUpperCase() === masterUsuario.toUpperCase() &&
      senha === masterSenha
    ) {
      // Cria sessão master e seta o cookie httpOnly
      await criarSessao({
        rh_id: null,
        empresa_id: null,
        razao_social: null,
        nome: "Master Admin",
        isMaster: true,
      });

      return NextResponse.json({ sucesso: true, isMaster: true, nome: "Master Admin" });
    }

    // ── Fluxo normal de RH ────────────────────────────────────────────────
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    const senhaHash = crypto.createHash("sha256").update(senha).digest("hex");

    const empresaRes = await pool.query(
      "SELECT id, razao_social FROM empresa WHERE cnpj = $1",
      [cnpjLimpo]
    );

    if (empresaRes.rowCount === 0) {
      return NextResponse.json(
        { erro: "Empresa não encontrada." },
        { status: 404 }
      );
    }

    const empresa = empresaRes.rows[0];

    const rhRes = await pool.query(
      "SELECT id, nome FROM funcionario_rh WHERE empresa_id = $1 AND senha_hash = $2",
      [empresa.id, senhaHash]
    );

    if (rhRes.rowCount === 0) {
      return NextResponse.json(
        { erro: "Senha incorreta para esta empresa." },
        { status: 401 }
      );
    }

    const rh = rhRes.rows[0];

    // Cria sessão e seta o cookie httpOnly
    await criarSessao({
      rh_id: rh.id,
      empresa_id: empresa.id,
      razao_social: empresa.razao_social,
      nome: rh.nome,
      isMaster: false,
    });

    return NextResponse.json({
      sucesso: true,
      isMaster: false,
      rh_id: rh.id,
      nome: rh.nome,
      empresa_id: empresa.id,
      razao_social: empresa.razao_social,
    });

  } catch (error) {
    console.error("Erro em /api/rh/auth:", error);
    return NextResponse.json(
      { erro: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
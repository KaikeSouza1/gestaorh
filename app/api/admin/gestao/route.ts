import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const empresas = await pool.query("SELECT * FROM empresa ORDER BY criado_em DESC");
    const usuarios = await pool.query(`
      SELECT f.*, e.razao_social 
      FROM funcionario_rh f 
      JOIN empresa e ON f.empresa_id = e.id 
      ORDER BY f.criado_em DESC
    `);
    return NextResponse.json({ empresas: empresas.rows, usuarios: usuarios.rows });
  } catch (error) { return NextResponse.json({ erro: "Erro ao buscar" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, data } = body;

    if (tipo === "EMPRESA") {
      const cnpjLimpo = data.cnpj.replace(/\D/g, "");
      await pool.query("INSERT INTO empresa (cnpj, razao_social) VALUES ($1, $2)", [cnpjLimpo, data.razao_social]);
    } 
    
    if (tipo === "USUARIO_RH") {
      const senhaHash = crypto.createHash("sha256").update(data.senha).digest("hex");
      await pool.query(
        "INSERT INTO funcionario_rh (empresa_id, nome, email, senha_hash) VALUES ($1, $2, $3, $4)",
        [data.empresa_id, data.nome, data.email, senhaHash]
      );
    }
    return NextResponse.json({ sucesso: true });
  } catch (error: any) { return NextResponse.json({ erro: error.message }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tipo, data } = body;

    if (tipo === "EMPRESA") {
      const cnpjLimpo = data.cnpj.replace(/\D/g, "");
      await pool.query("UPDATE empresa SET cnpj = $1, razao_social = $2 WHERE id = $3", [cnpjLimpo, data.razao_social, data.id]);
    } 
    
    if (tipo === "USUARIO_RH") {
      if (data.senha) {
        // Se mandou senha nova, atualiza o hash
        const senhaHash = crypto.createHash("sha256").update(data.senha).digest("hex");
        await pool.query(
          "UPDATE funcionario_rh SET empresa_id = $1, nome = $2, email = $3, senha_hash = $4 WHERE id = $5",
          [data.empresa_id, data.nome, data.email, senhaHash, data.id]
        );
      } else {
        // Sem senha nova, atualiza só os dados normais
        await pool.query(
          "UPDATE funcionario_rh SET empresa_id = $1, nome = $2, email = $3 WHERE id = $4",
          [data.empresa_id, data.nome, data.email, data.id]
        );
      }
    }
    return NextResponse.json({ sucesso: true });
  } catch (error: any) { return NextResponse.json({ erro: error.message }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const id = searchParams.get("id");

    if (tipo === "EMPRESA") {
      await pool.query("DELETE FROM empresa WHERE id = $1", [id]);
    } else if (tipo === "USUARIO_RH") {
      await pool.query("DELETE FROM funcionario_rh WHERE id = $1", [id]);
    }
    return NextResponse.json({ sucesso: true });
  } catch (error: any) { return NextResponse.json({ erro: error.message }, { status: 500 }); }
}
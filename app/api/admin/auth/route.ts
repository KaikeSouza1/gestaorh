import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuario, senha } = body;

    // LOGIN MASTER HARDCODED (Ou pode criar uma tabela 'admin_master')
    if (usuario === "LAERTE" && senha === "246618") {
      return NextResponse.json({ 
        sucesso: true, 
        role: "MASTER",
        nome: "Laerte Master"
      });
    }

    return NextResponse.json({ erro: "Acesso negado." }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
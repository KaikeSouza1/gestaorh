import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "rh_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

// Pega o secret de forma lazy — não quebra no build nem no import
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return "dev_fallback_secret_nao_usar_em_producao_32chars!!";
    }
    throw new Error("SESSION_SECRET não definida nas variáveis de ambiente.");
  }
  return secret;
}

export interface SessionPayload {
  rh_id: string | null;
  empresa_id: string | null;
  razao_social: string | null;
  nome: string;
  isMaster: boolean;
  exp: number;
}

function assinar(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const base64 = Buffer.from(data).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(base64).digest("base64url");
  return `${base64}.${sig}`;
}

function verificar(token: string): SessionPayload | null {
  try {
    const [base64, sig] = token.split(".");
    if (!base64 || !sig) return null;
    const esperado = crypto.createHmac("sha256", getSecret()).update(base64).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const espBuf = Buffer.from(esperado);
    if (sigBuf.length !== espBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, espBuf)) return null;
    const payload: SessionPayload = JSON.parse(Buffer.from(base64, "base64url").toString());
    if (Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function criarSessao(payload: Omit<SessionPayload, "exp">) {
  const cookieStore = await cookies();
  const completo: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const token = assinar(completo);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return completo;
}

export async function getSessao(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verificar(token);
  } catch {
    return null;
  }
}

export function getSessaoDoRequest(req: NextRequest): SessionPayload | null {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verificar(token);
  } catch {
    return null;
  }
}

export async function destruirSessao() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  } catch { /* silencioso */ }
}
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "rh_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

if (!process.env.SESSION_SECRET) {
  throw new Error("❌ SESSION_SECRET não definida nas variáveis de ambiente.");
}

const SECRET = process.env.SESSION_SECRET;

// ─── Estrutura do payload da sessão ────────────────────────────────────────
export interface SessionPayload {
  rh_id: string | null;        // null = master admin
  empresa_id: string | null;   // null = master admin
  razao_social: string | null;
  nome: string;
  isMaster: boolean;
  exp: number;                 // Unix timestamp de expiração
}

// ─── Assina o payload com HMAC-SHA256 ──────────────────────────────────────
function assinar(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const base64 = Buffer.from(data).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(base64)
    .digest("base64url");
  return `${base64}.${sig}`;
}

// ─── Verifica e decodifica o token ─────────────────────────────────────────
function verificar(token: string): SessionPayload | null {
  try {
    const [base64, sig] = token.split(".");
    if (!base64 || !sig) return null;

    // Recomputa a assinatura e compara com timing-safe
    const esperado = crypto
      .createHmac("sha256", SECRET)
      .update(base64)
      .digest("base64url");

    const sigBuf = Buffer.from(sig);
    const espBuf = Buffer.from(esperado);

    if (sigBuf.length !== espBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, espBuf)) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(base64, "base64url").toString()
    );

    // Verifica expiração
    if (Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Cria e define o cookie de sessão (uso em Route Handlers) ──────────────
export async function criarSessao(payload: Omit<SessionPayload, "exp">) {
  const cookieStore = await cookies();

  const completo: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };

  const token = assinar(completo);

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,          // Não acessível via JS no browser
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });

  return completo;
}

// ─── Lê e valida a sessão atual (uso em Route Handlers) ────────────────────
export async function getSessao(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verificar(token);
}

// ─── Lê a sessão a partir de um NextRequest (uso no middleware) ────────────
export function getSessaoDoRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verificar(token);
}

// ─── Apaga o cookie (logout) ───────────────────────────────────────────────
export async function destruirSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
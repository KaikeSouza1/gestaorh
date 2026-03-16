import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "rh_session";

// ─── Web Crypto — única API disponível no Edge Runtime do Vercel ──────────
async function verificarToken(token: string): Promise<any | null> {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return null;

    const [base64, sig] = token.split(".");
    if (!base64 || !sig) return null;

    // Importa a chave no formato Web Crypto
    const keyData = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Verifica a assinatura
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const dataBytes = new TextEncoder().encode(base64);
    const valido = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valido) return null;

    // Decodifica o payload
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);

    // Verifica expiração
    if (Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// Rotas públicas que não precisam de sessão
const ROTAS_PUBLICAS = [
  "/rh/login",
  "/rh/registrar",
  "/api/empregado/auth",
  "/api/rh/auth",
  "/api/rh/registrar",
  "/api/denuncia",
  "/api/denuncia/historico",
  "/api/chat",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Libera arquivos estáticos e Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Libera a página inicial (empregado) e o painel do empregado
  if (pathname === "/" || pathname.startsWith("/painel")) {
    return NextResponse.next();
  }

  // Libera rotas públicas
  const ehPublica = ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(rota + "/")
  );
  if (ehPublica) return NextResponse.next();

  // ── Verifica sessão via cookie ────────────────────────────────────────────
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const sessao = token ? await verificarToken(token) : null;

  // Sem sessão válida
  if (!sessao) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Não autorizado. Faça login." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/rh/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Área master — só master acessa /admin e /api/admin
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    !sessao.isMaster
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Acesso negado. Área restrita." },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/rh", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
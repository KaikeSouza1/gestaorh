import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessaoDoRequest } from "@/lib/session";

// Rotas que NÃO precisam de autenticação
const ROTAS_PUBLICAS = [
  "/",
  "/painel",
  "/rh/login",
  "/rh/registrar",
  "/api/empregado/auth",
  "/api/rh/auth",
  "/api/rh/registrar",
  "/api/denuncia",
  "/api/denuncia/historico",
  "/api/chat",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Libera arquivos estáticos e Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Libera rotas públicas
  const ehPublica = ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(rota + "?")
  );
  if (ehPublica) return NextResponse.next();

  // ── Verifica sessão ──────────────────────────────────────────────────────
  const sessao = getSessaoDoRequest(request);

  // Sem sessão → redireciona para login
  if (!sessao) {
    // Rotas de API sem sessão retornam 401 (não redireciona)
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

  // Rota do admin master — só master pode entrar
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    !sessao.isMaster
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Acesso negado. Área restrita ao Master." },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/rh", request.url));
  }

  // Tudo certo — injeta dados da sessão como headers (opcional, útil nas APIs)
  const response = NextResponse.next();
  response.headers.set("x-session-empresa-id", sessao.empresa_id ?? "master");
  response.headers.set("x-session-is-master", String(sessao.isMaster));
  return response;
}

export const config = {
  matcher: [
    // Aplica em tudo EXCETO _next/static, _next/image, favicon.ico
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
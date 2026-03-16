"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Lock, User, Building, ArrowRight, Loader2 } from "lucide-react";

export default function TelaAcesso() {
  const [isLogin, setIsLogin] = useState(true);
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // === A MÁGICA DO QR CODE COMEÇA AQUI ===
  useEffect(() => {
    // Lê a URL do navegador
    const urlParams = new URLSearchParams(window.location.search);
    const cnpjUrl = urlParams.get('cnpj');
    
    // Se encontrou um CNPJ na URL (veio do QR code)
    if (cnpjUrl) {
      setCnpj(cnpjUrl); // Preenche o campo CNPJ sozinho
      setIsLogin(false); // Já abre na aba de "Cadastrar" em vez de "Login"
    }
  }, []);
  // === FIM DA MÁGICA ===

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const response = await fetch("/api/empregado/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: isLogin ? "login" : "registrar",
          cpf,
          senha,
          cnpj: isLogin ? undefined : cnpj,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Ocorreu um erro inesperado.");
      } else {
        localStorage.setItem("empregado_id", data.id);
        localStorage.setItem("empresa_id", data.empresa_id);
        window.location.href = "/painel";
      }
    } catch (error) {
      setErro("Falha na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-emerald-200">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-10 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500 rounded-3xl shadow-lg shadow-emerald-500/20 mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Canal de Ética</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Ambiente Seguro e Criptografado</p>
        </div>

        <div className="p-10">
          <h2 className="text-xl font-bold text-slate-800 mb-8 text-center uppercase tracking-tighter">
            {isLogin ? "Acesse sua conta" : "Cadastro de Empregado"}
          </h2>

          {erro && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-2xl text-center font-bold uppercase">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-black text-slate-400 ml-1 uppercase">CNPJ Empresa</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700"
                    placeholder="00.000.000/0000-00"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 ml-1 uppercase">CPF</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 ml-1 uppercase">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-70 mt-4 uppercase tracking-widest"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>{isLogin ? "Entrar" : "Cadastrar"} <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErro(""); }}
            className="w-full mt-8 text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
          >
            {isLogin ? "Primeiro acesso? Vincule-se aqui" : "Já tem conta? Faça Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
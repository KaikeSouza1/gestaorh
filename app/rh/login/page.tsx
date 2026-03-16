"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Building, ArrowRight, Loader2 } from "lucide-react";

export default function LoginRH() {
  const [cnpj, setCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await fetch("/api/rh/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include" garante que o cookie httpOnly seja recebido
        credentials: "include",
        body: JSON.stringify({ cnpj, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Falha na autenticação.");
        return;
      }

      // ── Cookie httpOnly já foi setado pelo servidor ──
      // Não salvamos mais nada sensível no localStorage
      // Apenas dados de exibição não-sensíveis:
      if (data.isMaster) {
        localStorage.setItem("rh_nome", data.nome);
        window.location.href = "/admin";
      } else {
        localStorage.setItem("rh_nome", data.nome);
        localStorage.setItem("razao_social", data.razao_social);
        // empresa_id ainda fica no localStorage para uso no frontend (não é segredo)
        localStorage.setItem("empresa_id", data.empresa_id);
        window.location.href = "/rh";
      }

    } catch (error) {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-emerald-100">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500 space-y-8">

        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-600 rounded-3xl shadow-xl shadow-emerald-600/20 mb-4 transition-transform hover:scale-110">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Portal Administrativo</h1>
          <p className="text-emerald-600 font-bold mt-2 text-[10px] uppercase tracking-[0.3em] italic">Segurança & Conformidade</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-10 -mt-10 opacity-50"></div>

          <h2 className="text-xl font-bold text-slate-800 mb-8 text-center uppercase tracking-tighter relative z-10">
            Acesse sua Conta
          </h2>

          {erro && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] rounded-2xl text-center font-black uppercase animate-bounce">
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Identificação / CNPJ
              </label>
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="DIGITE SEU CNPJ OU USUÁRIO"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Senha de Acesso
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all active:scale-[0.98] uppercase tracking-widest mt-4 flex justify-center items-center gap-3 group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center space-y-4">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            Tecnologia de Proteção de Dados Pedroso
          </p>
          <button
            onClick={() => window.location.href = "/rh/registrar"}
            className="text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            Ainda não tem acesso? Clique aqui
          </button>
        </div>
      </div>
    </div>
  );
}
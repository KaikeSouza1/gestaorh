"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Lock, User, Building, ArrowRight, Loader2, KeyRound, AlertTriangle } from "lucide-react";

export default function TelaAcesso() {
  const [isLogin, setIsLogin] = useState(true);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cnpjUrl = urlParams.get('cnpj');
    if (cnpjUrl) {
      // Já aplica a máscara no CNPJ vindo da URL, se necessário
      handleCnpjChange({ target: { value: cnpjUrl } } as any);
      setIsLogin(false);
    }
  }, []);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); 
    if (value.length > 14) value = value.slice(0, 14);
    
    // Aplica a máscara: 00.000.000/0000-00
    value = value.replace(/^(\d{2})(\d)/, "$1.$2");
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
    value = value.replace(/(\d{4})(\d)/, "$1-$2");
    
    setCnpj(value);
  };

  // --- VALIDAÇÃO E ENVIO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    // 1. Limpa os dados para validação
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    const usuarioFormatado = usuario.trim().toLowerCase();

    // 2. Regras de Validação Front-end
    if (usuarioFormatado.length < 4) {
      return setErro("O usuário deve ter pelo menos 4 caracteres.");
    }
    if (!isLogin && cnpjLimpo.length !== 14) {
      return setErro("CNPJ inválido. Verifique o número da empresa.");
    }
    if (senha.length < 6) {
      return setErro("A senha deve ter pelo menos 6 caracteres.");
    }

    setLoading(true);

    try {
      const response = await fetch("/api/empregado/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: isLogin ? "login" : "registrar",
          usuario: usuarioFormatado, 
          senha,
          cnpj: isLogin ? undefined : cnpjLimpo,
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
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 relative">
        
        {/* BOTÃO ESCONDIDO DO GESTOR */}
        <button 
          onClick={() => window.location.href = "/rh/login"}
          title="Acesso Administrativo"
          className="hidden md:flex absolute top-5 right-5 items-center gap-1.5 p-2 rounded-lg text-slate-700 hover:text-emerald-400 hover:bg-slate-800/50 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer z-10"
        >
          <KeyRound className="w-3.5 h-3.5" /> Acesso Gestor
        </button>

        <div className="bg-slate-900 p-10 text-center relative">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500 rounded-3xl shadow-lg shadow-emerald-500/20 mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Canal de Ética</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Ambiente Seguro e Criptografado</p>
        </div>

        <div className="p-10">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center uppercase tracking-tighter">
            {isLogin ? "Acesse sua conta" : "Cadastro de Empregado"}
          </h2>

          {/* AVISO DE ANONIMATO E CUIDADO COM A SENHA NO CADASTRO */}
          {!isLogin && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in">
              <h3 className="text-amber-800 font-black text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> 100% Anônimo e Sigiloso
              </h3>
              <p className="text-amber-700 text-xs font-bold leading-relaxed">
                Você não precisa usar seu nome real ou CPF. <strong>Guarde muito bem seu Usuário e Senha!</strong> Como não pedimos seus dados, não há como recuperar o acesso depois.
              </p>
            </div>
          )}

          {erro && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-2xl text-center font-bold uppercase animate-in fade-in">
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
                    onChange={handleCnpjChange}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                    placeholder="00.000.000/0000-00"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 ml-1 uppercase">Identificação (Usuário)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                  
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
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"

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
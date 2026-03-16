"use client";

import { useState } from "react";
import { ShieldPlus, Building, User, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";

export default function RegistrarRH() {
  const [formData, setFormData] = useState({ cnpj: "", nome: "", email: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/rh/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Cadastro realizado! Agora faça o login.");
        window.location.href = "/rh/login";
      } else {
        const data = await res.json();
        setErro(data.erro);
      }
    } catch (err) {
      setErro("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10">
        <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldPlus className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Novo Gestor RH</h1>
        </div>

        {erro && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl text-center uppercase">{erro}</div>}

        <form onSubmit={handleRegistrar} className="space-y-4">
          <div className="relative">
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="CNPJ da Empresa" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold" 
              onChange={e => setFormData({...formData, cnpj: e.target.value})} />
          </div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Seu Nome" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold" 
              onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="email" placeholder="E-mail" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold" 
              onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="password" placeholder="Senha" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold" 
              onChange={e => setFormData({...formData, senha: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest">
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Criar Acesso Gestor"}
          </button>
        </form>

        <button onClick={() => window.location.href = "/rh/login"} className="w-full mt-6 text-xs font-bold text-slate-400 hover:text-blue-600 uppercase flex items-center justify-center gap-2">
            <ArrowLeft className="w-3 h-3" /> Voltar para Login
        </button>
      </div>
    </div>
  );
}
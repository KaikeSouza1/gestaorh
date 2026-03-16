"use client";

import { useState, useEffect } from "react";
import { 
  Shield, Plus, List, Loader2, CheckCircle, 
  Clock, MessageSquare, AlertTriangle, LogOut, Activity 
} from "lucide-react";

export default function PainelEmpregado() {
  const [abaAtiva, setAbaAtiva] = useState<"nova" | "historico">("nova");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contato, setContato] = useState("");
  const [loading, setLoading] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState("");
  
  const [historico, setHistorico] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const empresa_id = localStorage.getItem("empresa_id");
    const empregado_id = localStorage.getItem("empregado_id");

    if (!empresa_id || !empregado_id) return handleSair();

    try {
      const response = await fetch("/api/denuncia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id, empregado_id, categoria, descricao, contato_opc: contato }),
      });

      const data = await response.json();
      if (response.ok) {
        setProtocoloGerado(data.protocolo);
        setCategoria(""); setDescricao(""); setContato("");
      } else alert(data.erro);
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    const empresa_id = localStorage.getItem("empresa_id");
    const empregado_id = localStorage.getItem("empregado_id");

    try {
      const response = await fetch("/api/denuncia/historico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id, empregado_id }),
      });
      const data = await response.json();
      if (response.ok) setHistorico(data.denuncias);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  useEffect(() => {
    if (abaAtiva === "historico") carregarHistorico();
  }, [abaAtiva]);

  const handleSair = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // FUNÇÃO DE STATUS ATUALIZADA
  const getStatusVisual = (status: string) => {
    switch (status) {
      case "PENDENTE": 
        return <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> Aguardando Análise</span>;
      case "EM_ANALISE": 
        return <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest"><Activity className="w-3.5 h-3.5" /> Em Análise</span>;
      case "RESOLVIDO": 
        return <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest"><CheckCircle className="w-3.5 h-3.5" /> Concluído</span>;
      default: 
        return <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-widest">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-emerald-200 text-slate-900">
      
      {/* Header Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-md p-4 sticky top-0 z-50 border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 p-1.5 rounded-xl shadow-lg shadow-emerald-600/20">
              <Shield className="text-white w-5 h-5" />
            </div>
            <h1 className="font-black text-lg tracking-tighter text-slate-800 uppercase">Canal Seguro</h1>
          </div>
          <button 
            onClick={handleSair} 
            className="flex items-center gap-2 text-[10px] font-black bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-500 hover:text-rose-600 transition-all uppercase tracking-widest active:scale-95 shadow-sm"
          >
            Sair <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-5 mt-4">
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] mb-10 shadow-inner border border-slate-200/50 max-w-md mx-auto">
          <button
            onClick={() => { setAbaAtiva("nova"); setProtocoloGerado(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest rounded-[1.8rem] transition-all duration-300 ${
              abaAtiva === "nova" 
                ? "bg-white text-emerald-600 shadow-xl transform scale-[1.02]" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Plus className="w-4 h-4" /> Registrar
          </button>
          <button
            onClick={() => setAbaAtiva("historico")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest rounded-[1.8rem] transition-all duration-300 ${
              abaAtiva === "historico" 
                ? "bg-white text-emerald-600 shadow-xl transform scale-[1.02]" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List className="w-4 h-4" /> Acompanhar
          </button>
        </div>

        {/* CONTEÚDO: REGISTRAR */}
        {abaAtiva === "nova" && (
          protocoloGerado ? (
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-emerald-100 text-center animate-in zoom-in-95 duration-500">
              <div className="bg-emerald-50 p-6 rounded-full w-fit mx-auto mb-6">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase">Relato Salvo!</h2>
              <p className="text-sm text-slate-500 mb-10 font-medium">Anote seu protocolo de acompanhamento:</p>
              
              <div className="bg-slate-50 w-full text-4xl font-mono font-black text-emerald-600 py-8 rounded-[2rem] border-4 border-dashed border-emerald-100 tracking-[0.3em] shadow-inner uppercase">
                {protocoloGerado}
              </div>
              
              <button 
                onClick={() => setProtocoloGerado("")}
                className="mt-10 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:underline"
              >
                Registrar novo relato
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <div className="bg-emerald-50/50 border border-emerald-100/50 p-5 rounded-[2rem] flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900 font-bold leading-relaxed">
                  Ambiente seguro e 100% anônimo para atendimento da <strong>NR-01</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Natureza da Ocorrência</label>
                <select 
                  value={categoria} 
                  onChange={(e) => setCategoria(e.target.value)} 
                  className="w-full p-5 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 bg-slate-50 text-slate-700 font-black outline-none transition-all appearance-none cursor-pointer" 
                  required
                >
                  <option value="" disabled>Selecione a classificação...</option>
                  <option value="assedio_politico">Assédio Político / Eleitoral</option>
                  <option value="assedio_moral">Assédio Moral</option>
                  <option value="assedio_sexual">Assédio Sexual</option>
                  <option value="discriminacao">Discriminação ou Intimidação</option>
                  <option value="violencia">Violência no Trabalho</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Relato Detalhado</label>
                <textarea 
                  value={descricao} 
                  onChange={(e) => setDescricao(e.target.value)} 
                  rows={6} 
                  className="w-full p-6 border-2 border-slate-100 rounded-[2.5rem] focus:border-emerald-500 bg-slate-50 text-slate-700 font-bold outline-none transition-all resize-none placeholder:text-slate-300" 
                  placeholder="Descreva o ocorrido com detalhes..." 
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-2xl shadow-xl shadow-emerald-600/30 transform transition-all active:scale-95 uppercase tracking-widest"
              >
                {loading ? <Loader2 className="w-7 h-7 animate-spin mx-auto" /> : "Enviar Relato Seguro"}
              </button>
            </form>
          )
        )}

        {/* CONTEÚDO: ACOMPANHAR */}
        {abaAtiva === "historico" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
            {loadingHistorico ? (
              <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>
            ) : historico.length === 0 ? (
              <div className="bg-white p-16 rounded-[3rem] shadow-xl border border-slate-100 text-center flex flex-col items-center">
                <div className="bg-slate-50 p-5 rounded-full mb-4 text-slate-300">
                  <List className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Nenhum registro</h3>
              </div>
            ) : (
              historico.map((item, index) => (
                <div key={index} className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 hover:border-emerald-100 transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-100 font-mono">
                      PROTOCOLO: {item.protocolo}
                    </span>
                    {getStatusVisual(item.status)}
                  </div>
                  
                  <h3 className="font-black text-slate-800 mb-2 capitalize text-xl tracking-tighter">
                    {item.categoria.replace("_", " ")}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                    {item.descricao}
                  </p>
                  
                  {/* RESPOSTA DO RH - ATUALIZADA */}
                  {item.parecer_rh && (
                    <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 mt-6 shadow-inner animate-in fade-in slide-in-from-top-2">
                      <p className="text-[10px] font-black text-emerald-700 mb-2 flex items-center gap-2 uppercase tracking-widest">
                        <MessageSquare className="w-4 h-4" /> Resposta do RH:
                      </p>
                      <p className="text-sm text-emerald-800 font-bold italic leading-relaxed">
                        "{item.parecer_rh}"
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
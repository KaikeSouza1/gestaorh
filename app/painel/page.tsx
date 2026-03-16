"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, Plus, List, Loader2, CheckCircle,
  Clock, MessageSquare, AlertTriangle, LogOut, Activity, X, Send,
  ArrowRight, ClipboardCheck, FileText
} from "lucide-react";

async function fetchMensagens(protocolo: string) {
  const res = await fetch(`/api/chat?protocolo=${encodeURIComponent(protocolo)}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Timestamp': Date.now().toString(),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function PainelEmpregado() {
  const [abaAtiva, setAbaAtiva] = useState<"nova" | "historico">("nova");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState("");

  const [historico, setHistorico] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const [denunciaAtiva, setDenunciaAtiva] = useState<any>(null);
  // Aba do chat modal: "chat" ou "parecer"
  const [abaChatModal, setAbaChatModal] = useState<"chat" | "parecer">("chat");
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const denunciaAtivaRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { denunciaAtivaRef.current = denunciaAtiva; }, [denunciaAtiva]);

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
        body: JSON.stringify({ empresa_id, empregado_id, categoria, descricao }),
      });
      const data = await response.json();
      if (response.ok) {
        setProtocoloGerado(data.protocolo);
        setCategoria("");
        setDescricao("");
      } else { alert(data.erro); }
    } catch (error) { alert("Erro de conexão."); }
    finally { setLoading(false); }
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
    } catch (error) { console.error(error); }
    finally { setLoadingHistorico(false); }
  };

  useEffect(() => { if (abaAtiva === "historico") carregarHistorico(); }, [abaAtiva]);

  // ─── POLLING (5 segundos) ───────────────────────────────────────────────────
  const iniciarPolling = useCallback((protocolo: string) => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    const poll = async () => {
      const atual = denunciaAtivaRef.current;
      if (!atual) return;
      try {
        const msgs = await fetchMensagens(atual.protocolo);
        setMensagens(msgs);
      } catch (e) { console.error("Erro polling:", e); }
    };
    intervalRef.current = setInterval(poll, 5000);
  }, []);

  useEffect(() => {
    if (!denunciaAtiva) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [denunciaAtiva]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  const handleSair = () => { localStorage.clear(); window.location.href = "/"; };

  // Ir para histórico e já carregar
  const irParaHistorico = () => {
    setProtocoloGerado("");
    setAbaAtiva("historico");
  };

  const abrirChat = async (item: any) => {
    setDenunciaAtiva(item);
    setAbaChatModal("chat");
    setMensagens([]);
    setLoadingChat(true);
    try {
      const msgs = await fetchMensagens(item.protocolo);
      setMensagens(msgs);
    } catch (error) { setMensagens([]); }
    finally { setLoadingChat(false); }
    iniciarPolling(item.protocolo);
  };

  const enviarMensagem = async () => {
    const texto = novaMensagem.trim();
    if (!texto || !denunciaAtiva || enviando) return;
    setEnviando(true);
    const textoParaEnviar = texto;
    setNovaMensagem("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolo: denunciaAtiva.protocolo, remetente: "EMPREGADO", texto: textoParaEnviar }),
      });
      if (!res.ok) throw new Error("Falha ao enviar");
      const msgs = await fetchMensagens(denunciaAtiva.protocolo);
      setMensagens(msgs);
    } catch (error) {
      alert("Erro ao enviar mensagem. Tente novamente.");
      setNovaMensagem(textoParaEnviar);
    } finally { setEnviando(false); }
  };

  const getStatusVisual = (status: string) => {
    switch (status) {
      case "PENDENTE": return <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> Aguardando</span>;
      case "EM_ANALISE": return <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest"><Activity className="w-3.5 h-3.5" /> Em Análise</span>;
      case "RESOLVIDO": return <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest"><CheckCircle className="w-3.5 h-3.5" /> Concluído</span>;
      default: return <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-widest">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-emerald-200 text-slate-900">
      <header className="bg-white/80 backdrop-blur-md p-4 sticky top-0 z-40 border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 p-1.5 rounded-xl shadow-lg shadow-emerald-600/20">
              <Shield className="text-white w-5 h-5" />
            </div>
            <h1 className="font-black text-lg tracking-tighter text-slate-800 uppercase">Canal Seguro</h1>
          </div>
          <button onClick={handleSair} className="flex items-center gap-2 text-[10px] font-black bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-500 hover:text-rose-600 transition-all uppercase tracking-widest active:scale-95 shadow-sm">
            Sair <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-5 mt-4">
        {/* Tabs */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] mb-10 shadow-inner border border-slate-200/50 max-w-md mx-auto">
          <button
            onClick={() => { setAbaAtiva("nova"); setProtocoloGerado(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest rounded-[1.8rem] transition-all duration-300 ${abaAtiva === "nova" ? "bg-white text-emerald-600 shadow-xl transform scale-[1.02]" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Plus className="w-4 h-4" /> Registrar
          </button>
          <button
            onClick={() => setAbaAtiva("historico")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest rounded-[1.8rem] transition-all duration-300 ${abaAtiva === "historico" ? "bg-white text-emerald-600 shadow-xl transform scale-[1.02]" : "text-slate-500 hover:text-slate-700"}`}
          >
            <List className="w-4 h-4" /> Acompanhar
          </button>
        </div>

        {/* ── ABA NOVA DENÚNCIA ── */}
        {abaAtiva === "nova" && (
          protocoloGerado ? (
            // ── TELA DE SUCESSO COM BOTÃO RÁPIDO ──
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-emerald-100 text-center animate-in zoom-in-95 duration-500">
              <div className="bg-emerald-50 p-6 rounded-full w-fit mx-auto mb-6">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase">Relato Salvo!</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">Anote seu protocolo de acompanhamento:</p>

              {/* Protocolo */}
              <div className="bg-slate-50 w-full text-4xl font-mono font-black text-emerald-600 py-8 rounded-[2rem] border-4 border-dashed border-emerald-100 tracking-[0.3em] shadow-inner uppercase mb-8">
                {protocoloGerado}
              </div>

              {/* ── BOTÃO PRINCIPAL: IR PARA ACOMPANHAR ── */}
              <button
                onClick={irParaHistorico}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3 mb-4"
              >
                <List className="w-5 h-5" />
                Ver Meus Relatos
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setProtocoloGerado("")}
                className="w-full text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest py-2"
              >
                Registrar outro relato
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <div className="bg-emerald-50/50 border border-emerald-100/50 p-5 rounded-[2rem] flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900 font-bold leading-relaxed">Ambiente seguro e 100% anônimo para atendimento da <strong>NR-01</strong>.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Natureza da Ocorrência</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-5 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 bg-slate-50 text-slate-700 font-black outline-none transition-all appearance-none cursor-pointer" required>
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
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={6} className="w-full p-6 border-2 border-slate-100 rounded-[2.5rem] focus:border-emerald-500 bg-slate-50 text-slate-700 font-bold outline-none transition-all resize-none placeholder:text-slate-300" placeholder="Descreva o ocorrido com detalhes..." required />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-2xl shadow-xl shadow-emerald-600/30 transform transition-all active:scale-95 uppercase tracking-widest">
                {loading ? <Loader2 className="w-7 h-7 animate-spin mx-auto" /> : "Enviar Relato Seguro"}
              </button>
            </form>
          )
        )}

        {/* ── ABA HISTÓRICO ── */}
        {abaAtiva === "historico" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
            {loadingHistorico ? (
              <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>
            ) : historico.length === 0 ? (
              <div className="bg-white p-16 rounded-[3rem] shadow-xl border border-slate-100 text-center flex flex-col items-center">
                <div className="bg-slate-50 p-5 rounded-full mb-4 text-slate-300"><List className="w-10 h-10" /></div>
                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Nenhum registro</h3>
              </div>
            ) : (
              historico.map((item, index) => (
                <div key={index} className="bg-white rounded-[3rem] shadow-xl border border-slate-100 hover:border-emerald-100 transition-all duration-300 overflow-hidden">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-100 font-mono">PROTOCOLO: {item.protocolo}</span>
                      {getStatusVisual(item.status)}
                    </div>
                    <h3 className="font-black text-slate-800 mb-2 capitalize text-xl tracking-tighter">{item.categoria.replace("_", " ")}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3">{item.descricao}</p>

                    {/* ── PARECER DO RH (se existir) ── */}
                    {item.parecer_rh && (
                      <div className="bg-violet-50 border border-violet-100 rounded-[1.5rem] p-5 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-violet-100 p-1.5 rounded-lg text-violet-600">
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">Parecer Oficial do RH</span>
                        </div>
                        <p className="text-sm text-violet-800 font-bold leading-relaxed">{item.parecer_rh}</p>
                      </div>
                    )}

                    <button onClick={() => abrirChat(item)} className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg">
                      <MessageSquare className="w-4 h-4" /> Abrir Chat Seguro
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ═══ MODAL DO CHAT ═══════════════════════════════════════════════════════ */}
      {denunciaAtiva && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center sm:p-6 animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full max-w-2xl h-full sm:h-[90vh] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500 border border-slate-200">

            {/* Header */}
            <div className="bg-white p-6 sm:p-8 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-3 sm:p-4 rounded-xl shadow-lg shadow-emerald-600/20 text-white">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tighter">Canal Anônimo</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 font-mono">{denunciaAtiva.protocolo}</p>
                </div>
              </div>
              <button onClick={() => setDenunciaAtiva(null)} className="p-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas: Chat / Parecer */}
            <div className="bg-white border-b border-slate-200 shrink-0 px-6 sm:px-8 flex">
              <button
                onClick={() => setAbaChatModal("chat")}
                className={`flex items-center gap-2 px-5 py-4 font-black text-[10px] uppercase tracking-widest border-b-2 transition-all ${abaChatModal === "chat" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
                {mensagens.length > 0 && <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{mensagens.length}</span>}
              </button>
              <button
                onClick={() => setAbaChatModal("parecer")}
                className={`flex items-center gap-2 px-5 py-4 font-black text-[10px] uppercase tracking-widest border-b-2 transition-all ${abaChatModal === "parecer" ? "border-violet-500 text-violet-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Parecer do RH
                {denunciaAtiva.parecer_rh && <span className="bg-violet-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">✓</span>}
              </button>
            </div>

            {/* ── ABA CHAT ── */}
            {abaChatModal === "chat" && (
              <>
                <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
                  <div className="flex flex-col items-end w-full">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mx-2">Seu Relato Inicial</span>
                    <div className="bg-emerald-50 border border-emerald-100 p-5 sm:p-6 rounded-3xl rounded-tr-sm shadow-sm text-emerald-900 font-bold leading-relaxed max-w-[90%] sm:max-w-[85%] text-sm">{denunciaAtiva.descricao}</div>
                  </div>

                  {loadingChat ? (
                    <div className="flex justify-center pt-10"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : mensagens.length === 0 ? (
                    <div className="text-center py-8"><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhuma mensagem ainda. Aguarde a resposta do RH.</p></div>
                  ) : (
                    mensagens.map((msg: any) => (
                      <div key={msg.id} className={`flex flex-col ${msg.remetente === 'EMPREGADO' ? 'items-end' : 'items-start'} w-full animate-in fade-in slide-in-from-bottom-2`}>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mx-2">{msg.remetente === 'EMPREGADO' ? 'Você' : 'Equipe de RH'}</span>
                        <div className={`p-5 sm:p-6 rounded-3xl shadow-sm max-w-[90%] sm:max-w-[85%] font-bold leading-relaxed text-sm ${msg.remetente === 'EMPREGADO' ? 'bg-emerald-600 text-white rounded-tr-sm shadow-emerald-600/20' : 'bg-white border-2 border-slate-100 text-slate-700 rounded-tl-sm'}`}>{msg.texto}</div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {denunciaAtiva.status === "RESOLVIDO" ? (
                  <div className="bg-slate-100 p-6 text-center border-t border-slate-200">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Este caso foi encerrado e o chat bloqueado.</p>
                  </div>
                ) : (
                  <div className="bg-white p-4 sm:p-6 border-t border-slate-200 shrink-0">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Atualizando a cada 5s
                    </p>
                    <div className="flex items-end gap-3 sm:gap-4">
                      <textarea value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); } }} placeholder="Digite sua mensagem (Enter para enviar)..." className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 outline-none focus:border-emerald-500 font-bold text-slate-700 resize-none h-20 sm:h-24 placeholder:text-slate-300 transition-all text-sm disabled:opacity-60" disabled={enviando} />
                      <button onClick={enviarMensagem} disabled={enviando || !novaMensagem.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 h-20 sm:h-24 px-6 sm:px-8 flex flex-col items-center justify-center gap-1 sm:gap-2 group">
                        {enviando ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                        <span className="font-black uppercase tracking-widest text-[8px] sm:text-[9px]">Enviar</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── ABA PARECER ── */}
            {abaChatModal === "parecer" && (
              <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                {denunciaAtiva.parecer_rh ? (
                  <div className="space-y-6">
                    <div className="bg-violet-50 border border-violet-100 rounded-[2rem] p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-violet-100 p-3 rounded-xl text-violet-600">
                          <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-violet-800 text-sm uppercase tracking-tight">Parecer Oficial do RH</h4>
                          <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest mt-0.5">Posicionamento formal da empresa</p>
                        </div>
                      </div>
                      <p className="text-sm text-violet-900 font-bold leading-relaxed">{denunciaAtiva.parecer_rh}</p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-[1.5rem] p-5 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <p className="text-xs text-emerald-700 font-bold">Este relato recebeu um parecer oficial. Você pode continuar usando o chat para tirar dúvidas.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-300">
                      <FileText className="w-10 h-10" />
                    </div>
                    <h4 className="font-black text-slate-500 uppercase tracking-widest text-sm mb-2">Sem Parecer Ainda</h4>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs">
                      O RH ainda não emitiu um parecer oficial para este relato. Fique atento ao chat.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
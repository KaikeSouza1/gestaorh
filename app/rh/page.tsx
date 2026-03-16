"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, Search, AlertTriangle, CheckCircle,
  Clock, ChevronRight, LogOut, MessageSquare, X,
  Archive, Inbox, Layers, UserSearch, Send, Loader2
} from "lucide-react";

// Função utilitária para buscar mensagens sem cache — resolve o problema do Vercel CDN
async function fetchMensagens(protocolo: string) {
  const res = await fetch(`/api/chat?protocolo=${encodeURIComponent(protocolo)}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      // Cache-buster no header customizado (mais confiável que query param no Vercel)
      'X-Timestamp': Date.now().toString(),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function PainelRH() {
  const [dados, setDados] = useState<any>({ stats: {}, lista: [] });
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ busca: "", categoria: "", status: "", arquivados: false });
  const [denunciaSelecionada, setDenunciaSelecionada] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);

  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  // Ref para evitar closure stale no intervalo de polling
  const denunciaSelecionadaRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mantém a ref sincronizada com o estado
  useEffect(() => {
    denunciaSelecionadaRef.current = denunciaSelecionada;
  }, [denunciaSelecionada]);

  const carregarDados = async () => {
    const empId = localStorage.getItem("empresa_id");
    const query = new URLSearchParams({
      empresa_id: empId || "",
      ...filtros,
      arquivados: filtros.arquivados.toString(),
    }).toString();
    try {
      const res = await fetch(`/api/rh/denuncias?${query}`);
      const data = await res.json();
      setDados(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  // ─── POLLING DE MENSAGENS (5 segundos) ───────────────────────────────────────
  const iniciarPolling = useCallback((protocolo: string) => {
    // Limpa intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const poll = async () => {
      const atual = denunciaSelecionadaRef.current;
      if (!atual) return;
      try {
        const msgs = await fetchMensagens(atual.protocolo);
        setMensagens(msgs);
      } catch (e) {
        console.error("Erro no polling RH:", e);
      }
    };

    // Polling a cada 5 segundos
    intervalRef.current = setInterval(poll, 5000);
  }, []);

  // Para o polling quando o painel fecha
  useEffect(() => {
    if (!denunciaSelecionada) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [denunciaSelecionada]);

  // Scroll automático
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const abrirDenuncia = async (item: any) => {
    setDenunciaSelecionada(item);
    setMensagens([]);
    setLoadingChat(true);
    try {
      const msgs = await fetchMensagens(item.protocolo);
      setMensagens(msgs);
    } catch (e) {
      setMensagens([]);
    } finally {
      setLoadingChat(false);
    }
    // Inicia polling após abrir
    iniciarPolling(item.protocolo);
  };

  const enviarMensagemRH = async () => {
    const texto = novaMensagem.trim();
    if (!texto || !denunciaSelecionada || enviando) return;

    setEnviando(true);
    const textoParaEnviar = texto;
    setNovaMensagem(""); // Limpa campo imediatamente (UX melhor)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocolo: denunciaSelecionada.protocolo,
          remetente: "RH",
          texto: textoParaEnviar,
        }),
      });

      if (!res.ok) throw new Error("Falha ao enviar");

      // Busca mensagens imediatamente após envio
      const msgs = await fetchMensagens(denunciaSelecionada.protocolo);
      setMensagens(msgs);
    } catch (error) {
      alert("Erro ao enviar mensagem. Tente novamente.");
      setNovaMensagem(textoParaEnviar); // Devolve o texto se falhou
    } finally {
      setEnviando(false);
    }
  };

  const salvarAlteracoes = async (campos: any, fecharAposSalvar = false) => {
    setSalvando(true);
    try {
      const res = await fetch("/api/rh/denuncias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denuncia_id: denunciaSelecionada.id, ...campos }),
      });
      if (res.ok) {
        setDenunciaSelecionada({ ...denunciaSelecionada, ...campos });
        if (fecharAposSalvar) setDenunciaSelecionada(null);
        carregarDados();
      }
    } finally {
      setSalvando(false);
    }
  };

  if (loading && dados.lista.length === 0)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-emerald-600 animate-pulse tracking-widest uppercase">
        Carregando Painel...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-emerald-100 text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white flex flex-col border-r border-slate-200 sticky top-0 h-screen z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-black text-lg tracking-tighter text-slate-800 uppercase">Canal Seguro</h1>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setFiltros({ ...filtros, arquivados: false })}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${!filtros.arquivados
                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                }`}
            >
              <Inbox className="w-4 h-4" /> Denúncias
            </button>
            <button
              onClick={() => setFiltros({ ...filtros, arquivados: true })}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${filtros.arquivados
                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                }`}
            >
              <Archive className="w-4 h-4" /> Arquivados
            </button>
          </nav>
        </div>
        <div className="mt-auto p-6">
          <div className="bg-slate-100 p-4 rounded-2xl mb-4 border border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa Logada</p>
            <p className="text-xs font-bold text-slate-700 uppercase truncate">
              {typeof window !== 'undefined' ? localStorage.getItem("razao_social") || "Carregando..." : ""}
            </p>
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.href = "/rh/login"; }}
            className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Gestão RH</h2>
              <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">
                Monitoramento de Conformidade
              </p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="BUSCAR PROTOCOLO..."
                className="pl-11 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none w-72 font-bold transition-all shadow-sm uppercase placeholder:text-slate-300"
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: <Layers />, label: "Total", value: dados.stats.total || 0 },
              { icon: <Clock />, label: "Pendentes", value: dados.stats.pendentes || 0 },
              { icon: <AlertTriangle />, label: "Críticos", value: dados.stats.criticos || 0 },
              { icon: <Shield />, label: "Políticos", value: dados.stats.politicos || 0 },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 group hover:scale-[1.02] transition-all"
              >
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  {card.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                  <th className="px-10 py-6">Protocolo</th>
                  <th className="px-10 py-6">Ocorrência</th>
                  <th className="px-10 py-6 text-center">Nível</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right pr-14">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dados.lista.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-50/30 transition-all cursor-pointer group"
                    onClick={() => abrirDenuncia(item)}
                  >
                    <td className="px-10 py-8 font-mono font-black text-slate-800 text-lg tracking-tight">
                      {item.protocolo}
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-black text-slate-700 uppercase text-xs tracking-tight">
                        {item.categoria.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">
                        {new Date(item.criado_em).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${item.prioridade === 'ALTA'
                          ? 'bg-rose-100 text-rose-600 border-rose-200'
                          : item.prioridade === 'BAIXA'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                          }`}
                      >
                        {item.prioridade || 'MÉDIA'}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${item.status === 'EM_ANALISE'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : item.status === 'RESOLVIDO'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm'
                            : 'bg-amber-100 text-amber-600 border-amber-200'
                          }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right pr-14">
                      <div className="inline-flex p-3 bg-white border border-slate-200 text-slate-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL DE ANÁLISE DO RH */}
      {denunciaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-end animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-200">
            {/* Header */}
            <div className="bg-white p-6 sm:p-8 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-4 rounded-xl shadow-lg shadow-emerald-600/20 text-white">
                  <UserSearch className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                    {denunciaSelecionada.protocolo}
                  </h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Atualizando a cada 5s
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDenunciaSelecionada(null)}
                className="p-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Controles */}
            <div className="bg-white px-8 py-6 border-b border-slate-200 shrink-0 grid grid-cols-2 gap-6 shadow-sm z-10">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Status do Caso
                </label>
                <select
                  value={denunciaSelecionada.status}
                  onChange={(e) => salvarAlteracoes({ status: e.target.value })}
                  disabled={salvando}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-800 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  <option value="PENDENTE">Aguardando (Pendente)</option>
                  <option value="EM_ANALISE">Em Análise Ativa</option>
                  <option value="RESOLVIDO">Concluído / Resolvido</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nível de Prioridade
                </label>
                <select
                  value={denunciaSelecionada.prioridade}
                  onChange={(e) => salvarAlteracoes({ prioridade: e.target.value })}
                  disabled={salvando}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-800 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta / Urgente</option>
                </select>
              </div>
              <div className="col-span-2">
                <button
                  onClick={() => salvarAlteracoes({ arquivado: !denunciaSelecionada.arquivado }, true)}
                  disabled={salvando}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all uppercase text-[10px] tracking-widest border border-slate-200 disabled:opacity-60"
                >
                  <Archive className="w-4 h-4" />
                  {denunciaSelecionada.arquivado ? "Mover para Caixa de Entrada" : "Arquivar Protocolo"}
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {/* Relato original */}
              <div className="flex flex-col items-start w-full">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">
                  Relato Original (Anônimo)
                </span>
                <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl rounded-tl-sm shadow-sm text-slate-700 font-bold leading-relaxed max-w-[85%] text-sm">
                  {denunciaSelecionada.descricao}
                </div>
              </div>

              {loadingChat ? (
                <div className="flex justify-center pt-10">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : mensagens.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Nenhuma mensagem ainda.
                  </p>
                </div>
              ) : (
                mensagens.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.remetente === 'RH' ? 'items-end' : 'items-start'} w-full animate-in fade-in slide-in-from-bottom-2`}
                  >
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mx-2">
                      {msg.remetente === 'RH' ? 'Você (RH)' : 'Empregado'}
                    </span>
                    <div
                      className={`p-6 rounded-3xl shadow-sm max-w-[85%] font-bold leading-relaxed text-sm ${msg.remetente === 'RH'
                        ? 'bg-emerald-600 text-white rounded-tr-sm shadow-emerald-600/20'
                        : 'bg-white border-2 border-slate-100 text-slate-700 rounded-tl-sm'
                        }`}
                    >
                      {msg.texto}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white p-6 border-t border-slate-200 shrink-0">
              <div className="flex items-end gap-4">
                <textarea
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviarMensagemRH();
                    }
                  }}
                  placeholder="Envie uma mensagem ou solicite mais informações (Enter para enviar)..."
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 outline-none focus:border-emerald-500 font-bold text-slate-700 resize-none h-24 placeholder:text-slate-300 transition-all disabled:opacity-60"
                  disabled={enviando}
                />
                <button
                  onClick={enviarMensagemRH}
                  disabled={enviando || !novaMensagem.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-5 rounded-3xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 h-24 px-8 flex flex-col items-center justify-center gap-2 group"
                >
                  {enviando
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  }
                  <span className="font-black uppercase tracking-widest text-[9px]">Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
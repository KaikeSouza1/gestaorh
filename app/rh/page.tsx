"use client";

import { useState, useEffect } from "react";
import { 
  Shield, Search, AlertTriangle, CheckCircle, 
  Clock, ChevronRight, FileText, LogOut, MessageSquare, X, 
  Archive, Inbox, Layers, UserSearch, Save, Activity
} from "lucide-react";

export default function PainelRH() {
  const [dados, setDados] = useState<any>({ stats: {}, lista: [] });
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ busca: "", categoria: "", status: "", arquivados: false });
  const [denunciaSelecionada, setDenunciaSelecionada] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);

  const carregarDados = async () => {
    const empId = localStorage.getItem("empresa_id");
    const query = new URLSearchParams({ 
      empresa_id: empId || "", 
      ...filtros, 
      arquivados: filtros.arquivados.toString() 
    }).toString();

    try {
      const res = await fetch(`/api/rh/denuncias?${query}`);
      const data = await res.json();
      setDados(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, [filtros]);

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
    } finally { setSalvando(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-emerald-600 animate-pulse tracking-widest">CARREGANDO PAINEL...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-emerald-100 text-slate-900">
      
      {/* Sidebar Light & Clean */}
      <aside className="w-72 bg-white flex flex-col border-r border-slate-200 sticky top-0 h-screen z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-black text-lg tracking-tighter text-slate-800 uppercase">Canal Seguro</h1>
          </div>
          
          <nav className="space-y-2">
            <SidebarLink icon={<Inbox className="w-4 h-4" />} label="Denúncias" active={!filtros.arquivados} onClick={() => setFiltros({...filtros, arquivados: false})} />
            <SidebarLink icon={<Archive className="w-4 h-4" />} label="Arquivados" active={filtros.arquivados} onClick={() => setFiltros({...filtros, arquivados: true})} />
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-slate-100 p-4 rounded-2xl mb-4 border border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa Logada</p>
            <p className="text-xs font-bold text-slate-700 uppercase truncate">{localStorage.getItem("razao_social") || "Pedroso Informática"}</p>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = "/rh/login"; }} className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
            <LogOut className="w-4 h-4" /> Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Gestão RH</h2>
              <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Monitoramento de Conformidade NR-01</p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="BUSCAR PROTOCOLO..." 
                className="pl-11 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none w-72 font-bold transition-all shadow-sm uppercase"
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
              />
            </div>
          </div>

          {/* Stats Cards Reais e Limpos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard label="Total" value={dados.stats.total} icon={<Layers />} />
            <StatsCard label="Pendentes" value={dados.stats.pendentes} icon={<Clock />} />
            <StatsCard label="Críticos" value={dados.stats.criticos} icon={<AlertTriangle />} />
            <StatsCard label="Políticos" value={dados.stats.politicos} icon={<Shield />} />
          </div>

          {/* Tabela Branca e Perfeita */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                  <th className="px-10 py-6">Protocolo</th>
                  <th className="px-10 py-6">Ocorrência</th>
                  <th className="px-10 py-6 text-center">Nível</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right pr-14">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dados.lista.map((item: any) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-all cursor-pointer group" onClick={() => setDenunciaSelecionada(item)}>
                    <td className="px-10 py-8 font-mono font-black text-slate-800 text-lg tracking-tight">{item.protocolo}</td>
                    <td className="px-10 py-8">
                      <p className="font-black text-slate-700 uppercase text-xs tracking-tight">{item.categoria.replace('_', ' ')}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(item.criado_em).toLocaleDateString()}</p>
                    </td>
                    <td className="px-10 py-8 text-center"><PriorityBadge level={item.prioridade} /></td>
                    <td className="px-10 py-8"><StatusBadge status={item.status} /></td>
                    <td className="px-10 py-8 text-right pr-14">
                      <div className="inline-flex p-3 bg-white border border-slate-200 text-slate-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de Análise - Emerald Edition */}
      {denunciaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-10 overflow-y-auto animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-4 rounded-2xl shadow-xl shadow-emerald-600/20 text-white"><UserSearch className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{denunciaSelecionada.protocolo}</h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Análise de Conduta</p>
                </div>
              </div>
              <button onClick={() => setDenunciaSelecionada(null)} className="p-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all text-slate-400"><X /></button>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status do Caso</p>
                  <StatusBadge status={denunciaSelecionada.status} />
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Gravidade</p>
                  <PriorityBadge level={denunciaSelecionada.prioridade} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Relato Recebido</label>
                <div className="bg-slate-50 p-8 rounded-[2rem] text-slate-700 font-bold leading-relaxed border border-slate-200 italic shadow-inner">
                  "{denunciaSelecionada.descricao}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Alterar Status</label>
                  <select 
                    value={denunciaSelecionada.status}
                    onChange={(e) => salvarAlteracoes({ status: e.target.value })}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="PENDENTE">Aguardando</option>
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="RESOLVIDO">Concluído</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Prioridade</label>
                  <select 
                    value={denunciaSelecionada.prioridade}
                    onChange={(e) => salvarAlteracoes({ prioridade: e.target.value })}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-emerald-600 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta / Urgente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resposta do Compliance ao Funcionário</label>
                  {salvando && <span className="text-[10px] font-black text-emerald-600 animate-pulse uppercase tracking-widest">Salvando no banco...</span>}
                </div>
                <textarea 
                  className="w-full p-8 bg-emerald-50/30 border-2 border-emerald-100 rounded-[2.5rem] outline-none focus:border-emerald-500 font-bold text-slate-800 h-48 transition-all shadow-sm placeholder:text-slate-300"
                  placeholder="Escreva aqui o parecer oficial..."
                  defaultValue={denunciaSelecionada.parecer_rh}
                  onBlur={(e) => salvarAlteracoes({ parecer: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => salvarAlteracoes({ arquivado: !denunciaSelecionada.arquivado }, true)}
                  className="flex-1 flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-5 rounded-2xl transition-all uppercase text-[10px] tracking-widest"
                >
                  <Archive className="w-4 h-4" /> {denunciaSelecionada.arquivado ? "Mover para Entrada" : "Arquivar"}
                </button>
                <button 
                  onClick={() => setDenunciaSelecionada(null)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all active:scale-95 uppercase text-[10px] tracking-widest"
                >
                  Finalizar Edição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${active ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"}`}>
      {icon} {label}
    </button>
  );
}

function StatsCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 group hover:scale-[1.02] transition-all">
      <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tighter">{value || 0}</p>
      </div>
    </div>
  );
}

function PriorityBadge({ level }: { level: string }) {
  const cfg: any = { 
    ALTA: "bg-rose-100 text-rose-600 border-rose-200", 
    MEDIA: "bg-emerald-100 text-emerald-600 border-emerald-200", 
    BAIXA: "bg-slate-100 text-slate-500 border-slate-200" 
  };
  return <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${cfg[level] || cfg.MEDIA}`}>{level || 'MÉDIA'}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: any = { 
    PENDENTE: "bg-amber-100 text-amber-600 border-amber-200", 
    EM_ANALISE: "bg-blue-100 text-blue-700 border-blue-200", 
    RESOLVIDO: "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm" 
  };
  return <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${cfg[status] || cfg.PENDENTE}`}>{status}</span>;
}
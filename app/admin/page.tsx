"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, Globe, Users, LogOut, Plus, 
  X, Edit, Trash2, QrCode, Copy, CheckCircle,
  Printer, Download
} from "lucide-react";

export default function PainelMaster() {
  const [aba, setAba] = useState<"empresas" | "usuarios">("empresas");
  const [lista, setLista] = useState<any>({ empresas: [], usuarios: [] });
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState<"empresa" | "usuario" | "qrcode" | null>(null);
  const [form, setForm] = useState<any>({});
  const [isEditando, setIsEditando] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);

  const carregarTudo = async () => {
    try {
      const res = await fetch("/api/admin/gestao");
      const data = await res.json();
      setLista(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { carregarTudo(); }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tipo = modal === "empresa" ? "EMPRESA" : "USUARIO_RH";
    const method = isEditando ? "PUT" : "POST";
    
    const res = await fetch("/api/admin/gestao", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, data: form }),
    });

    if (res.ok) {
      setModal(null); setForm({}); setIsEditando(false);
      carregarTudo();
    } else {
      alert("Erro ao salvar.");
    }
  };

  const handleExcluir = async (id: string, tipo: "EMPRESA" | "USUARIO_RH") => {
    if (!confirm(`Tem certeza que deseja EXCLUIR este registro? Esta ação é irreversível.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/gestao?tipo=${tipo}&id=${id}`, { method: "DELETE" });
    if (res.ok) carregarTudo();
    else alert("Erro ao excluir.");
  };

  const abrirModalEditar = (item: any, tipo: "empresa" | "usuario") => {
    setForm(item);
    setIsEditando(true);
    setModal(tipo);
  };

  const abrirModalQR = (empresa: any) => {
    setQrCodeData(empresa);
    setModal("qrcode");
  };

  const copiarLink = () => {
    const link = `${window.location.origin}/?cnpj=${qrCodeData.cnpj}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // --- NOVAS FUNÇÕES: IMPRIMIR E BAIXAR QR CODE ---
  
  // 1. Imprime um cartaz bem simples (Nome, QR Code e Frase)
  const imprimirCartazSimplificado = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/?cnpj=${qrCodeData.cnpj}`)}`;
    const janela = window.open('', '', 'width=800,height=900');
    if (!janela) return alert("Habilite os popups para imprimir.");
    
    janela.document.write(`
      <html>
        <head>
          <title>Acesso - ${qrCodeData.razao_social}</title>
          <style>
            body { font-family: 'Arial', sans-serif; text-align: center; padding: 50px; color: #1e293b; }
            h1 { font-size: 36px; font-weight: 900; text-transform: uppercase; margin-bottom: 40px; }
            img { max-width: 400px; margin-bottom: 40px; }
            p { font-size: 20px; font-weight: bold; color: #475569; }
          </style>
        </head>
        <body>
          <h1>${qrCodeData.razao_social}</h1>
          <img src="${qrUrl}" onload="window.print();window.close()" />
          <p>Aponte a câmera para aceder ao sistema.</p>
        </body>
      </html>
    `);
    janela.document.close();
  };

  // 2. Imprime SOMENTE a imagem do QR Code
  const imprimirSoQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/?cnpj=${qrCodeData.cnpj}`)}`;
    const janela = window.open('', '', 'width=600,height=600');
    if (!janela) return alert("Habilite os popups para imprimir.");

    janela.document.write(`
      <html>
        <head>
          <title>QR Code</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            img { max-width: 100%; max-height: 100vh; }
          </style>
        </head>
        <body>
          <img src="${qrUrl}" onload="window.print();window.close()" />
        </body>
      </html>
    `);
    janela.document.close();
  };

  const baixarQRCode = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/?cnpj=${qrCodeData.cnpj}`)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `QR_Code_${qrCodeData.razao_social.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("Erro ao baixar. Tente clicar com o botão direito na imagem e 'Guardar como'.");
    }
  };

  if (loading && lista.empresas.length === 0) return <div className="h-screen flex items-center justify-center bg-white font-black text-emerald-600 tracking-widest uppercase">Acedendo ao QG Master...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-emerald-100 text-slate-900">
      
      {/* Sidebar Admin Master */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-8 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20"><ShieldCheck className="w-6 h-6" /></div>
          <h1 className="font-black text-xl uppercase tracking-tighter text-emerald-400 italic">Master Admin</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setAba("empresas")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${aba === "empresas" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-slate-400 hover:bg-slate-800"}`}>
            <Globe className="w-4 h-4" /> Gestão Empresas
          </button>
          <button onClick={() => setAba("usuarios")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${aba === "usuarios" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-slate-400 hover:bg-slate-800"}`}>
            <Users className="w-4 h-4" /> Gestores de RH
          </button>
        </nav>

        <button onClick={() => window.location.href = "/rh/login"} className="flex items-center gap-3 text-slate-500 font-black text-[10px] uppercase hover:text-rose-400 transition-all border-t border-slate-800 pt-6">
          <LogOut className="w-4 h-4" /> Sair do Master
        </button>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-10 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">{aba === "empresas" ? "Empresas" : "Gestores"}</h2>
              <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 italic">Controlo Central SaaS</p>
            </div>
            <button 
              onClick={() => { setForm({}); setIsEditando(false); setModal(aba === "empresas" ? "empresa" : "usuario"); }}
              className="bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
            >
              <Plus className="w-5 h-5" /> {aba === "empresas" ? "Nova Empresa" : "Novo Gestor"}
            </button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  {aba === "empresas" ? (
                    <>
                      <th className="px-10 py-7">Razão Social</th>
                      <th className="px-10 py-7">CNPJ</th>
                      <th className="px-10 py-7 text-right pr-14">Ações Estratégicas</th>
                    </>
                  ) : (
                    <>
                      <th className="px-10 py-7">Gestor</th>
                      <th className="px-10 py-7">Acesso</th>
                      <th className="px-10 py-7 text-right pr-14">Ações</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(aba === "empresas" ? lista.empresas : lista.usuarios).map((item: any) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-all group">
                    {aba === "empresas" ? (
                      <>
                        <td className="px-10 py-8 font-black text-slate-800 uppercase text-sm tracking-tight">{item.razao_social}</td>
                        <td className="px-10 py-8 font-bold text-emerald-600 font-mono tracking-widest">{item.cnpj}</td>
                        <td className="px-10 py-8 text-right pr-10">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => abrirModalQR(item)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Gerar QR Code">
                              <QrCode className="w-5 h-5" />
                            </button>
                            <button onClick={() => abrirModalEditar(item, "empresa")} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Editar">
                              <Edit className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleExcluir(item.id, "EMPRESA")} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Excluir">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-10 py-8 font-black text-slate-800 uppercase text-sm">{item.nome}</td>
                        <td className="px-10 py-8">
                          <p className="font-bold text-slate-500">{item.email}</p>
                          <span className="inline-block mt-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[9px] font-black border border-slate-200 uppercase tracking-widest">
                            {item.razao_social}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right pr-10">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => abrirModalEditar(item, "usuario")} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Editar">
                              <Edit className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleExcluir(item.id, "USUARIO_RH")} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Excluir">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: CADASTRO / EDIÇÃO */}
      {(modal === "empresa" || modal === "usuario") && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <form onSubmit={handleSalvar} className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {isEditando ? "Editar " : "Cadastrar "}
                {modal === "empresa" ? "Empresa" : "Gestor"}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {modal === "empresa" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Razão Social</label>
                    <input type="text" value={form.razao_social || ""} placeholder="NOME DA EMPRESA" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-slate-900 uppercase" required onChange={e => setForm({...form, razao_social: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CNPJ</label>
                    <input type="text" value={form.cnpj || ""} placeholder="APENAS NÚMEROS" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-emerald-600 tracking-widest" required onChange={e => setForm({...form, cnpj: e.target.value})} />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Empresa do Gestor</label>
                    <select value={form.empresa_id || ""} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-slate-900 cursor-pointer" required onChange={e => setForm({...form, empresa_id: e.target.value})}>
                      <option value="">SELECIONE A EMPRESA...</option>
                      {lista.empresas.map((e: any) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome do Gestor</label>
                    <input type="text" value={form.nome || ""} placeholder="NOME COMPLETO" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-slate-900 uppercase" required onChange={e => setForm({...form, nome: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail</label>
                    <input type="email" value={form.email || ""} placeholder="rh@empresa.com.pt" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-slate-900" required onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{isEditando ? "Nova Senha (deixe em branco para não alterar)" : "Senha Temporária"}</label>
                    <input type="password" placeholder="••••••••" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-slate-900" required={!isEditando} onChange={e => setForm({...form, senha: e.target.value})} />
                  </div>
                </>
              )}
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-6 rounded-2xl shadow-xl transition-all uppercase text-[10px] tracking-widest">
              {isEditando ? "Guardar Alterações" : "Concluir Registo"}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: QR CODE GENERATOR (AGORA COM IMPRIMIR E BAIXAR) */}
      {modal === "qrcode" && qrCodeData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl text-center space-y-6 relative overflow-hidden border border-slate-100">
            <button onClick={() => setModal(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X className="w-4 h-4" /></button>
            
            <div className="bg-blue-50 p-5 rounded-full w-fit mx-auto text-blue-600 mb-2"><QrCode className="w-8 h-8" /></div>
            
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{qrCodeData.razao_social}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material de Divulgação</p>
            </div>

            <div className="bg-white border-2 border-slate-100 p-4 rounded-[2rem] shadow-sm mx-auto w-fit transition-transform hover:scale-105 duration-300">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/?cnpj=${qrCodeData.cnpj}`)}`} 
                alt="QR Code" 
                className="w-48 h-48 rounded-2xl"
              />
            </div>

            {/* BOTÕES DE AÇÃO DO QR CODE */}
            <div className="flex flex-col gap-3 pt-4">
              
              <div className="flex gap-3">
                <button onClick={imprimirCartazSimplificado} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20">
                  <Printer className="w-4 h-4" /> Cartaz Simples
                </button>
                <button onClick={imprimirSoQRCode} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                  <Printer className="w-4 h-4" /> Só QR Code
                </button>
              </div>

              <button onClick={baixarQRCode} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20">
                <Download className="w-4 h-4" /> Baixar Imagem PNG
              </button>
              
              <button onClick={copiarLink} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${copiado ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {copiado ? <><CheckCircle className="w-4 h-4" /> Link Copiado!</> : <><Copy className="w-4 h-4" /> Copiar Link Direto</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
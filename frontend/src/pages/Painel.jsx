import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getToken, logout } from '../api.js';

const COLUNAS = [
  { chave: 'aFazer', titulo: '📋 A fazer' },
  { chave: 'fazendo', titulo: '🔧 Fazendo' },
  { chave: 'feito', titulo: '✅ Feito (últimos 3)' },
];

const fmtCpf = (c) => c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

function Card({ o, eu, pecas, categorias, onAcao, onErro }) {
  const [video, setVideo] = useState('');
  const [pecaId, setPecaId] = useState('');
  const [qtd, setQtd] = useState(1);
  const meu = o.funcionarioId === eu?.id;

  const acao = async (fn) => { try { await fn(); await onAcao(); } catch (e) { onErro(e.message); await onAcao(); } };

  return (
    <div className="kcard">
      <strong>{o.problema}</strong>
      <p>{o.descricao}</p>
      <small>👤 {o.cliente.nome} · {fmtCpf(o.clienteCpf)} · 📱 {o.cliente.whatsapp}</small>
      {o.fotoUrl && <small>🖼️ Foto: {o.fotoUrl}</small>}
      {o.funcionario && <small>🛠️ Responsável: {o.funcionario.username}</small>}
      {o.videoUrl && <small>🎥 Vídeo: {o.videoUrl}</small>}

      {o.status !== 'FEITO' && (
        <select value={o.categoriaId || ''} onChange={(e) =>
          acao(() => api(`/ordens/${o.id}`, { method: 'PUT', body: { categoriaId: e.target.value || null } }))}>
          <option value="">Sem categoria</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      )}
      {o.status === 'FEITO' && o.categoria && <small>🏷️ {o.categoria.nome}</small>}

      {o.pecas.length > 0 && (
        <ul className="pecas">
          {o.pecas.map((p) => (
            <li key={p.pecaId}>
              {p.quantidade}x {p.peca.nome}
              {o.status !== 'FEITO' && (
                <button className="x" onClick={() => acao(() => api(`/ordens/${o.id}/pecas/${p.pecaId}`, { method: 'DELETE' }))}>✕</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {o.status === 'A_FAZER' && (
        <button onClick={() => acao(() => api(`/ordens/${o.id}/aceitar`, { method: 'PATCH' }))}>Aceitar serviço</button>
      )}

      {o.status === 'FAZENDO' && meu && (
        <>
          <div className="linha">
            <select value={pecaId} onChange={(e) => setPecaId(e.target.value)}>
              <option value="">+ peça…</option>
              {pecas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <input type="number" min={1} value={qtd} style={{ width: 60 }} onChange={(e) => setQtd(e.target.value)} />
            <button disabled={!pecaId} onClick={() => acao(() => api(`/ordens/${o.id}/pecas/${pecaId}`, { method: 'POST', body: { quantidade: Number(qtd) } }))}>Add</button>
          </div>
          <input placeholder="Vídeo de teste (ex.: teste x11)" value={video} onChange={(e) => setVideo(e.target.value)} />
          <div className="linha">
            <button onClick={() => acao(() => api(`/ordens/${o.id}/concluir`, { method: 'PATCH', body: { videoUrl: video } }))}>Concluir</button>
            <button className="sec" onClick={() => acao(() => api(`/ordens/${o.id}/devolver`, { method: 'PATCH' }))}>Devolver</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Painel() {
  const nav = useNavigate();
  const [aba, setAba] = useState('kanban');
  const [eu, setEu] = useState(null);
  const [kanban, setKanban] = useState({ aFazer: [], fazendo: [], feito: [] });
  const [pecas, setPecas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [logs, setLogs] = useState([]);
  const [erro, setErro] = useState('');
  const [novaPeca, setNovaPeca] = useState({ nome: '', preco: '', estoque: '' });
  const [novaCat, setNovaCat] = useState('');

  const sair = useCallback(() => { logout(); nav('/painel/login'); }, [nav]);

  const carregar = useCallback(async () => {
    try {
      const [k, p, c, l] = await Promise.all([
        api('/ordens/kanban'), api('/pecas'), api('/categorias'), api('/logs'),
      ]);
      setKanban(k); setPecas(p); setCategorias(c); setLogs(l);
    } catch (e) {
      if (e.status === 401) sair(); else setErro(e.message);
    }
  }, [sair]);

  useEffect(() => {
    if (!getToken()) { nav('/painel/login'); return; }
    api('/auth/me').then(setEu).catch(sair);
    carregar();
  }, [nav, sair, carregar]);

  const mostrarErro = (m) => { setErro(m); setTimeout(() => setErro(''), 4000); };
  const tentar = async (fn) => { try { await fn(); await carregar(); } catch (e) { mostrarErro(e.message); } };

  return (
    <div className="container largo">
      <header className="topo">
        <h1>🔧 Painel de manutenção</h1>
        <span>{eu?.username} <button className="sec" onClick={sair}>Sair</button> <Link to="/">Site do cliente</Link></span>
      </header>

      <nav className="abas">
        {['kanban', 'pecas', 'historico'].map((a) => (
          <button key={a} className={aba === a ? 'ativa' : 'sec'} onClick={() => setAba(a)}>
            {{ kanban: 'Kanban', pecas: 'Peças e categorias', historico: 'Histórico (log)' }[a]}
          </button>
        ))}
      </nav>

      {erro && <p className="erro">{erro}</p>}

      {aba === 'kanban' && (
        <div className="kanban">
          {COLUNAS.map((col) => (
            <section key={col.chave} className="coluna">
              <h3>{col.titulo} <span>({kanban[col.chave].length})</span></h3>
              {kanban[col.chave].map((o) => (
                <Card key={o.id} o={o} eu={eu} pecas={pecas} categorias={categorias} onAcao={carregar} onErro={mostrarErro} />
              ))}
            </section>
          ))}
        </div>
      )}

      {aba === 'pecas' && (
        <div className="duas">
          <div className="card">
            <h2>Peças</h2>
            <form className="linha" onSubmit={(e) => { e.preventDefault(); tentar(async () => {
              await api('/pecas', { method: 'POST', body: novaPeca });
              setNovaPeca({ nome: '', preco: '', estoque: '' });
            }); }}>
              <input required placeholder="Nome" value={novaPeca.nome} onChange={(e) => setNovaPeca({ ...novaPeca, nome: e.target.value })} />
              <input required type="number" step="0.01" min="0" placeholder="Preço" style={{ width: 90 }} value={novaPeca.preco} onChange={(e) => setNovaPeca({ ...novaPeca, preco: e.target.value })} />
              <input required type="number" min="0" placeholder="Estoque" style={{ width: 90 }} value={novaPeca.estoque} onChange={(e) => setNovaPeca({ ...novaPeca, estoque: e.target.value })} />
              <button>Salvar</button>
            </form>
            <ul className="lista">
              {pecas.map((p) => (
                <li key={p.id}>{p.nome} — R$ {p.preco.toFixed(2)} · estoque {p.estoque}
                  <button className="x" onClick={() => tentar(() => api(`/pecas/${p.id}`, { method: 'DELETE' }))}>✕</button></li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2>Categorias</h2>
            <form className="linha" onSubmit={(e) => { e.preventDefault(); tentar(async () => {
              await api('/categorias', { method: 'POST', body: { nome: novaCat } }); setNovaCat('');
            }); }}>
              <input required placeholder="Ex.: Bateria" value={novaCat} onChange={(e) => setNovaCat(e.target.value)} />
              <button>Salvar</button>
            </form>
            <ul className="lista">
              {categorias.map((c) => (
                <li key={c.id}>{c.nome}
                  <button className="x" onClick={() => tentar(() => api(`/categorias/${c.id}`, { method: 'DELETE' }))}>✕</button></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {aba === 'historico' && (
        <div className="card">
          <h2>Serviços arquivados</h2>
          {logs.length === 0 && <p>Nenhum serviço arquivado ainda.</p>}
          <ul className="lista">
            {logs.map((l) => (
              <li key={l.id}>
                <strong>{l.problema}</strong> — {l.clienteNome} ({fmtCpf(l.clienteCpf)})<br />
                <small>Por {l.funcionarioNome || '—'} · vídeo: {l.videoUrl} · concluído em {new Date(l.concluidoEm).toLocaleString('pt-BR')}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, maskCpf, maskFone } from '../api.js';

const vazio = { nome: '', cpf: '', whatsapp: '', problema: '', descricao: '', fotoUrl: '' };
const STATUS = { A_FAZER: 'A fazer', FAZENDO: 'Em andamento', FEITO: 'Concluído' };

export default function Cliente() {
  const [f, setF] = useState(vazio);
  const [msg, setMsg] = useState(null);
  const [consulta, setConsulta] = useState({ cpf: '', itens: null, erro: '' });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));

  async function enviar(e) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await api('/public/ordens', { method: 'POST', auth: false, body: f });
      setMsg({ ok: true, texto: r.message });
      setF(vazio);
    } catch (err) {
      setMsg({ ok: false, texto: err.message });
    }
  }

  async function consultar(e) {
    e.preventDefault();
    try {
      const itens = await api(`/public/ordens/${consulta.cpf.replace(/\D/g, '')}`, { auth: false });
      setConsulta((c) => ({ ...c, itens, erro: '' }));
    } catch (err) {
      setConsulta((c) => ({ ...c, itens: null, erro: err.message }));
    }
  }

  return (
    <div className="container">
      <header className="topo">
        <h1> Oficina E-Bike</h1>
        <Link to="/painel/login">Área do funcionário</Link>
      </header>

      <form className="card" onSubmit={enviar}>
        <h2>Abrir chamado de manutenção</h2>

        <label>Nome *
          <input maxLength={50} required value={f.nome} onChange={(e) => set('nome', e.target.value)} />
        </label>
        <label>CPF *
          <input required inputMode="numeric" placeholder="000.000.000-00" value={f.cpf}
            onChange={(e) => set('cpf', maskCpf(e.target.value))} />
        </label>
        <label>WhatsApp de contato *
          <input required type="tel" placeholder="(53) 99999-9999" value={f.whatsapp}
            onChange={(e) => set('whatsapp', maskFone(e.target.value))} />
        </label>
        <label>Problema * <small>{f.problema.length}/50</small>
          <input maxLength={50} required placeholder="Ex.: bateria não carrega" value={f.problema}
            onChange={(e) => set('problema', e.target.value)} />
        </label>
        <label>Descrição do problema * <small>{f.descricao.length}/250</small>
          <textarea maxLength={250} required rows={4}
            placeholder="Ex.: o painel mostra 100% mas o motor não tem potência comigo em cima"
            value={f.descricao} onChange={(e) => set('descricao', e.target.value)} />
        </label>
        <label>Foto do problema <small>(opcional – nome do arquivo)</small>
          <input placeholder="Ex.: carenagem_quebrada.jpg" value={f.fotoUrl}
            onChange={(e) => set('fotoUrl', e.target.value)} />
        </label>

        <button type="submit">Enviar chamado</button>
        {msg && <p className={msg.ok ? 'ok' : 'erro'}>{msg.texto}</p>}
      </form>

      <form className="card" onSubmit={consultar}>
        <h2>Acompanhar meus chamados</h2>
        <div className="linha">
          <input placeholder="Seu CPF" value={consulta.cpf}
            onChange={(e) => setConsulta({ ...consulta, cpf: maskCpf(e.target.value) })} />
          <button type="submit">Consultar</button>
        </div>
        {consulta.erro && <p className="erro">{consulta.erro}</p>}
        {consulta.itens && (
          <ul className="lista">
            {consulta.itens.map((o) => (
              <li key={o.id}>
                <strong>{o.problema}</strong> — {STATUS[o.status]}
                <small> ({new Date(o.criadoEm).toLocaleDateString('pt-BR')})</small>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

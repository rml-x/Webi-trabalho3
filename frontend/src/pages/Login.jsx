import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken } from '../api.js';

export default function Login() {
  const nav = useNavigate();
  const [registrar, setRegistrar] = useState(false);
  const [f, setF] = useState({ username: '', email: '', password: '', adminCode: '' });
  const [msg, setMsg] = useState(null);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));

  async function enviar(e) {
    e.preventDefault();
    setMsg(null);
    try {
      if (registrar) {
        await api('/auth/register', { method: 'POST', auth: false, body: f });
        setMsg({ ok: true, texto: 'Conta criada! Agora faça login.' });
        setRegistrar(false);
      } else {
        const r = await api('/auth/login', { method: 'POST', auth: false, body: { email: f.email, password: f.password } });
        setToken(r.token);
        nav('/painel');
      }
    } catch (err) {
      setMsg({ ok: false, texto: err.message });
    }
  }

  return (
    <div className="container pequeno">
      <header className="topo"><h1>Área do funcionário</h1><Link to="/">Voltar</Link></header>
      <form className="card" onSubmit={enviar}>
        <h2>{registrar ? 'Criar conta' : 'Entrar'}</h2>
        {registrar && (
          <label>Nome de usuário
            <input required value={f.username} onChange={(e) => set('username', e.target.value)} />
          </label>
        )}
        <label>E-mail
          <input type="email" required value={f.email} onChange={(e) => set('email', e.target.value)} />
        </label>
        <label>Senha
          <input type="password" required minLength={6} value={f.password} onChange={(e) => set('password', e.target.value)} />
        </label>
        {registrar && (
          <label>Senha do admin
            <input type="password" required value={f.adminCode} onChange={(e) => set('adminCode', e.target.value)} />
          </label>
        )}
        <button type="submit">{registrar ? 'Cadastrar' : 'Entrar'}</button>
        {msg && <p className={msg.ok ? 'ok' : 'erro'}>{msg.texto}</p>}
        <button type="button" className="link" onClick={() => { setRegistrar(!registrar); setMsg(null); }}>
          {registrar ? 'Já tenho conta' : 'Criar nova conta de funcionário'}
        </button>
      </form>
    </div>
  );
}

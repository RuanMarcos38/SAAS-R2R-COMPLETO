'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
export default function Login() {
  const router = useRouter(); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setError('');
    const result = await signIn('credentials',{ email,password,redirect:false });
    setBusy(false);
    if (result?.error) return setError('E-mail ou senha inválidos.');
    router.replace('/dashboard');router.refresh();
  }
  return <main className="loginShell"><div className="loginCard">
    <div className="brandMark">R<span>2</span>R</div>
    <h1>Bem-vindo ao Centro de Comando</h1><p className="muted">Acesse a operação da sua agência de marketing.</p>
    <form onSubmit={submit} className="formStack">
      <label>E-mail<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Senha<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primaryBtn" disabled={busy}>{busy?'Acessando...':'Entrar no painel'}</button>
    </form>
  </div></main>;
}

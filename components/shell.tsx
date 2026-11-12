'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { modules } from '@/lib/catalog';
export function Shell({ children, name, role, tenant }: { children: React.ReactNode; name: string; role: string; tenant: string }) {
  const path=usePathname();
  return <div className="appShell">
    <aside className="sidebar">
      <div className="sideTop"><div className="brandMark">R<span>2</span>R</div><small>MARKETING DIGITAL</small></div>
      <div className="sideSection">VISÃO GERAL</div>
      <Link className={'navItem '+(path==='/dashboard'?'active':'')} href="/dashboard">◫ <span>Centro de Comando</span></Link>
      <Link className={'navItem '+(path==='/automacoes'?'active':'')} href="/automacoes">⌘ <span>Automações</span></Link>
      <Link className={'navItem '+(path==='/diretor-ia'?'active':'')} href="/diretor-ia">✦ <span>Diretor-Geral IA</span></Link>
      <Link className={'navItem '+(path==='/ia-provedores'?'active':'')} href="/ia-provedores">⚙ <span>Conectar ChatGPT / Claude</span></Link>
      <div className="sideSection">DEPARTAMENTOS E OPERAÇÕES</div>
      <nav>{Object.entries(modules).map(([key, config])=><Link key={key} className={'navItem '+(path==='/modulos/'+key?'active':'')} href={'/modulos/'+key}>▤ <span>{config.name}</span></Link>)}</nav>
      <div className="sideFooter"><strong>{tenant}</strong><small>{name} · {role}</small><button onClick={()=>signOut({callbackUrl:'/login'})}>Sair da conta</button></div>
    </aside>
    <div className="workspace"><header className="topbar"><span>Plataforma de Gestão Integrada</span><div className="avatar">{name.slice(0,1).toUpperCase()}</div></header><main className="mainContent">{children}</main></div>
  </div>;
}

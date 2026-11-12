'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
type Integration={id:string;name:string;category:string;configured:boolean;verified:boolean;active:boolean;detail:string;route:string|null};
export function IntegrationsHub(){
 const [items,setItems]=useState<Integration[]>([]);
 const [error,setError]=useState('');
 useEffect(()=>{let mounted=true;fetch('/api/integrations/catalog',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Falha ao consultar integrações');return r.json()}).then(d=>{if(mounted)setItems(d.items)}).catch(e=>{if(mounted)setError(e.message)});return()=>{mounted=false}},[]);
 return <section className="integrationList">
  <div className="notice"><strong>Central de conexões.</strong> Uma integração só é considerada operacional após autenticação, autorização e teste ponta a ponta. A configuração de um segredo, por si só, não comprova conectividade.</div>
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="integrationGrid">{items.map(item=><article className="panel integrationCard" key={item.id}>
    <div className="integrationTop"><div className="integrationGlyph">{item.name.slice(0,1)}</div>
      <span className={'status '+(item.verified?'good':'')}>{item.verified?'Testada':item.configured?'Configurada (não testada)':'Pendente'}</span>
    </div>
    <h2>{item.name}</h2><div className="muted">{item.category}</div>
    <p>{item.detail}</p>
    {item.route?<Link className="ghostBtn" href={item.route}>Configurar conexão</Link>:<span className="muted">Conexão externa precisa de autorização e implementação</span>}
  </article>)}</div>
 </section>
}

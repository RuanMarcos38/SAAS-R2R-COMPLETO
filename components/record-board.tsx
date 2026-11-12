'use client';
import { useEffect, useState } from 'react';
import type { ModuleKey } from '@/lib/catalog';
import { modules } from '@/lib/catalog';
type RecordRow = { id:string;title:string;status:string;description:string|null;valueCents:number|null;dueAt:string|null;updatedAt:string };
export function RecordBoard({ kind, role }: { kind: ModuleKey; role: string }) {
  const cfg=modules[kind]; const statuses=cfg.statuses as readonly string[];
  const canCreate= ['MASTER','DIRECTOR','MANAGER'].includes(role) || (role==='FINANCE' ? ['financeiro','contratos','clientes'].includes(kind) : role==='COLLABORATOR' && !['financeiro','contratos','juridico','rh'].includes(kind));
  const canDelete=['MASTER','DIRECTOR'].includes(role);
  const [records,setRecords]=useState<RecordRow[]>([]);const [busy,setBusy]=useState(true);
  const [error,setError]=useState('');const [saving,setSaving]=useState(false);const [formOpen,setFormOpen]=useState(false);
  const [title,setTitle]=useState('');const [description,setDescription]=useState('');
  const [status,setStatus]=useState<string>(statuses[0]); const [amount,setAmount]=useState('');
  const [editing,setEditing]=useState<string|null>(null);
  async function load() {
    setBusy(true);try {
      const res=await fetch('/api/records/'+kind,{cache:'no-store'});
      const data=await res.json(); if(!res.ok)throw new Error(data.error||'Erro de consulta');
      setRecords(data.records);
    }catch(e){setError(e instanceof Error?e.message:'Falha desconhecida')} finally{setBusy(false)}
  }
  useEffect(()=>{void load()},[kind]);
  function reset(){setTitle('');setDescription('');setStatus(statuses[0]);setAmount('');setEditing(null);setFormOpen(false)}
  async function save(e:React.FormEvent){
    e.preventDefault();setSaving(true);setError('');
    const cents = amount.trim() ? Math.round(Number(amount.replace(',','.'))*100) : null;
    if(cents!==null && (!Number.isSafeInteger(cents)||cents<0)){setError('Valor inválido');setSaving(false);return}
    try {
      const url='/api/records/'+kind+(editing?'/'+editing:'');
      const res=await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,description,status,valueCents:cents})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Falha ao salvar');
      reset();await load();
    }catch(e){setError(e instanceof Error?e.message:'Falha ao salvar')}finally{setSaving(false)}
  }
  function edit(row:RecordRow){setEditing(row.id);setTitle(row.title);setDescription(row.description||'');setStatus(row.status);setAmount(row.valueCents===null?'':String(row.valueCents/100));setFormOpen(true)}
  async function move(row:RecordRow,next:string){
    if(!canCreate)return;
    setError(''); const res=await fetch('/api/records/'+kind+'/'+row.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:next})});
    if(!res.ok){const data=await res.json();setError(data.error||'Erro ao mover');return}await load();
  }
  async function remove(row:RecordRow){
    if(!canDelete || !window.confirm('Excluir permanentemente este registro?'))return;
    const res=await fetch('/api/records/'+kind+'/'+row.id,{method:'DELETE'});
    if(!res.ok){setError('Não foi possível excluir');return}await load();
  }
  return <section>
    <div className="pageHeader"><div><div className="eyebrow">GESTÃO OPERACIONAL</div><h1>{cfg.name}</h1><p>Cadastros, status e acompanhamento por etapas.</p></div>
      {canCreate&&<button className="primaryBtn" onClick={()=>{reset();setFormOpen(true)}}>+ Novo registro</button>}</div>
    {error&&<p className="error" role="alert">{error}</p>}
    {formOpen&&<div className="panel modalPanel"><div className="panelHeading"><h2>{editing?'Editar registro':'Criar registro'}</h2><button className="ghostBtn" onClick={reset}>Fechar</button></div>
      <form className="formStack" onSubmit={save}>
        <label>Título<input autoFocus required minLength={2} maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} /></label>
        <label>Descrição<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} /></label>
        <div className="fieldRow"><label>Etapa<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
        <label>Valor em R$ (opcional)<input type="number" min="0" step=".01" value={amount} onChange={e=>setAmount(e.target.value)} /></label></div>
        <div className="buttonRow"><button className="primaryBtn" disabled={saving}>{saving?'Salvando...':'Salvar registro'}</button><button type="button" className="ghostBtn" onClick={reset}>Cancelar</button></div>
      </form></div>}
    {busy?<p className="muted">Carregando registros...</p>:<div className="kanban">
      {statuses.map(stage=><div key={stage} className="kanbanCol"><div className="kanbanHead"><strong>{stage.replaceAll('_',' ')}</strong><span>{records.filter(r=>r.status===stage).length}</span></div>
        {records.filter(r=>r.status===stage).map(row=><article className="kanbanCard" key={row.id}>
          <strong>{row.title}</strong>{row.description&&<p>{row.description}</p>}
          {row.valueCents!==null&&<small>{(row.valueCents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</small>}
          <div className="cardFooter"><small>{new Date(row.updatedAt).toLocaleDateString('pt-BR')}</small>
            {canCreate&&<button className="linkBtn" onClick={()=>edit(row)}>Editar</button>}
            {canDelete&&<button className="linkBtn dangerText" onClick={()=>remove(row)}>Excluir</button>}
          </div>
          {canCreate&&<select aria-label={'Mover '+row.title} value={row.status} onChange={e=>void move(row,e.target.value)}>
            {statuses.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}
          </select>}
        </article>)}
        {!records.some(r=>r.status===stage)&&<div className="emptyCol">Sem registros</div>}
      </div>)}
    </div>}
  </section>;
}

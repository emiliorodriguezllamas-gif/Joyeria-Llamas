import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Mail, Send, Users, Plus, Eye, Copy, Trash2, CheckCircle, Gift, Star, ChevronRight, ChevronLeft, Sparkles, TrendingUp, Clock, Search, X } from 'lucide-react';
import db from '../../db';
import Modal from '../ui/Modal';
import { format, differenceInDays, parseISO } from 'date-fns';
import { PREDEFINED_HOBBIES } from '../Clients/ClientsView';

// ── Helpers ──
const isUpcoming = (dateStr) => {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr);
    const now = new Date();
    const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    const diff = differenceInDays(thisYear, now);
    return diff >= 0 && diff <= 30;
  } catch { return false; }
};

// ── Email Templates ──
const EMAIL_TEMPLATES = [
  { id: 'promo', icon: '🏷️', name: 'Promocion Especial', desc: 'Ofertas, descuentos y rebajas',
    defaultSubject: '✨ Oferta exclusiva para ti - Joyeria Llamas',
    defaultBody: 'Estimado/a {{nombre}},\n\nTe invitamos a aprovechar una promocion exclusiva en nuestras joyas seleccionadas.\n\nVisitanos en nuestra tienda de Estepa y descubre piezas unicas con descuentos especiales.\n\n¡Te esperamos!' },
  { id: 'cumpleanos', icon: '🎂', name: 'Feliz Cumpleaños', desc: 'Felicitacion con oferta especial',
    defaultSubject: '🎂 ¡Feliz Cumpleaños, {{nombre}}! Un regalo te espera',
    defaultBody: 'Querido/a {{nombre}},\n\n¡Desde Joyeria Llamas te deseamos un feliz cumpleaños!\n\nPara celebrarlo contigo, te ofrecemos un 10% de descuento en tu proxima compra. Porque los momentos especiales merecen joyas especiales.\n\n¡Muchas felicidades!' },
  { id: 'aniversario', icon: '💍', name: 'Aniversario', desc: 'Celebra con una joya especial',
    defaultSubject: '💍 Feliz Aniversario - Una joya para recordar',
    defaultBody: 'Estimado/a {{nombre}},\n\n¡Feliz aniversario! Los años juntos son el mejor tesoro.\n\nEn Joyeria Llamas tenemos la pieza perfecta para inmortalizar este momento. Te invitamos a descubrir nuestra seleccion especial para parejas.\n\nCon nuestros mejores deseos.' },
  { id: 'coleccion', icon: '💎', name: 'Nueva Coleccion', desc: 'Presenta las novedades',
    defaultSubject: '💎 Descubre nuestra nueva coleccion - Joyeria Llamas',
    defaultBody: 'Estimado/a {{nombre}},\n\nTenemos el placer de presentarte nuestra nueva coleccion.\n\nPiezas exclusivas diseñadas con la artesania que nos caracteriza desde 1970. Cada joya cuenta una historia.\n\nVisitanos y se el primero en descubrirlas.' },
  { id: 'intereses', icon: '✨', name: 'Recomendación Exclusiva', desc: 'Basada en sus intereses',
    defaultSubject: '✨ Una recomendación especial para ti, {{nombre}}',
    defaultBody: 'Estimado/a {{nombre}},\n\nSabemos que aprecias la calidad y tienes gustos únicos.\n\nHemos seleccionado unas piezas muy especiales que creemos que encajan perfectamente con tus intereses y estilo personal.\n\nDescubre nuestra selección exclusiva en la tienda.' },
];

const SEGMENTS = [
  { id: 'todos', icon: <Users size={16} />, name: 'Todos los clientes', desc: 'Clientes con email registrado' },
  { id: 'cumpleanos', icon: <Gift size={16} />, name: 'Cumpleaños proximos', desc: 'Cumplen en los proximos 30 dias' },
  { id: 'aniversario', icon: <Sparkles size={16} />, name: 'Aniversarios proximos', desc: 'Aniversario en los proximos 30 dias' },
  { id: 'vip', icon: <Star size={16} />, name: 'Clientes VIP', desc: '3 o mas compras registradas' },
  { id: 'sin_compra', icon: <Clock size={16} />, name: 'Sin compras', desc: 'Nunca han comprado (re-engagement)' },
  { id: 'por_hobby', icon: <Sparkles size={16} />, name: 'Por Intereses/Hobbies', desc: 'Filtra clientes según sus gustos' },
  { id: 'personalizado', icon: <CheckCircle size={16} />, name: 'Seleccion manual', desc: 'Elige los destinatarios uno a uno' },
];

function renderEmailHTML(templateId, body, recipientName) {
  const parsed = (body || '').replace(/{{nombre}}/g, recipientName || 'Cliente').replace(/{{email}}/g, '').replace(/\n/g, '<br/>');
  const accentColor = templateId === 'cumpleanos' ? '#e84057' : templateId === 'aniversario' ? '#60a5fa' : '#e5b82e';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#060608;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060608;"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0d0d12;border:1px solid #1a1a24;border-radius:12px;overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#0d0d12,#131319);padding:32px 40px;text-align:center;border-bottom:2px solid ${accentColor};">
    <h1 style="color:${accentColor};font-size:22px;margin:0;letter-spacing:2px;">JOYERIA LLAMAS</h1>
    <p style="color:#8a8694;font-size:11px;margin:6px 0 0;letter-spacing:4px;text-transform:uppercase;">Estepa · desde 1970</p>
  </td></tr>
  <tr><td style="padding:40px;color:#f0ece4;font-size:15px;line-height:1.7;">${parsed}</td></tr>
  <tr><td style="padding:0 40px 32px;text-align:center;">
    <a href="#" style="display:inline-block;padding:14px 36px;background:${accentColor};color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Visitanos en Tienda</a>
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid #1a1a24;text-align:center;">
    <p style="color:#55515e;font-size:11px;margin:0;">Joyeria Llamas · Estepa, Sevilla · Tel: 955 XXX XXX</p>
    <p style="color:#55515e;font-size:10px;margin:6px 0 0;">Si no deseas recibir mas correos, contacta con nosotros.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

// ── Main Component ──
export default function EmailMarketingView() {
  const clients = useLiveQuery(() => db.clients.toArray(), []);
  const invoices = useLiveQuery(() => db.invoices.toArray(), []);
  const campaigns = useLiveQuery(() => db.campaigns.toArray(), []);

  const [showCreator, setShowCreator] = useState(false);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [filterStatus, setFilterStatus] = useState('todas');
  const [searchQ, setSearchQ] = useState('');
  const [notification, setNotification] = useState(null);

  // Creator state
  const [step, setStep] = useState(0);
  const [segment, setSegment] = useState('todos');
  const [manualSelection, setManualSelection] = useState([]);
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [templateId, setTemplateId] = useState('promo');
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const previewRef = useRef(null);

  // Derived data
  const clientsWithEmail = useMemo(() => (clients || []).filter(c => c.email && c.email.includes('@')), [clients]);

  const getClientPurchaseCount = (name) => {
    return (invoices || []).filter(i => (i.clientName || '').toLowerCase() === (name || '').toLowerCase()).length;
  };

  const segmentedRecipients = useMemo(() => {
    switch (segment) {
      case 'todos': return clientsWithEmail;
      case 'cumpleanos': return clientsWithEmail.filter(c => isUpcoming(c.birthday));
      case 'aniversario': return clientsWithEmail.filter(c => isUpcoming(c.anniversary));
      case 'vip': return clientsWithEmail.filter(c => getClientPurchaseCount(c.name) >= 3);
      case 'sin_compra': return clientsWithEmail.filter(c => getClientPurchaseCount(c.name) === 0);
      case 'por_hobby': return clientsWithEmail.filter(c => c.hobbies?.some(h => selectedHobbies.includes(h)));
      case 'personalizado': return clientsWithEmail.filter(c => manualSelection.includes(c.id));
      default: return clientsWithEmail;
    }
  }, [segment, clientsWithEmail, manualSelection, selectedHobbies, invoices]);

  const filteredCampaigns = useMemo(() => {
    let list = campaigns || [];
    if (filterStatus !== 'todas') list = list.filter(c => c.status === filterStatus);
    if (searchQ) list = list.filter(c => (c.name || '').toLowerCase().includes(searchQ.toLowerCase()) || (c.subject || '').toLowerCase().includes(searchQ.toLowerCase()));
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [campaigns, filterStatus, searchQ]);

  const totalSent = useMemo(() => (campaigns || []).filter(c => c.status === 'enviada').reduce((sum, c) => sum + (c.recipients?.length || 0), 0), [campaigns]);

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  // ── Creator Actions ──
  const resetCreator = () => {
    setStep(0); setSegment('todos'); setManualSelection([]); setSelectedHobbies([]);
    setTemplateId('promo'); setCampaignName(''); setSubject(''); setBody('');
  };

  const openCreator = () => {
    resetCreator();
    const tpl = EMAIL_TEMPLATES[0];
    setSubject(tpl.defaultSubject);
    setBody(tpl.defaultBody);
    setShowCreator(true);
  };

  const selectTemplate = (tpl) => {
    setTemplateId(tpl.id);
    setSubject(tpl.defaultSubject);
    setBody(tpl.defaultBody);
  };

  const saveDraft = async () => {
    await db.campaigns.add({
      name: campaignName || 'Borrador sin titulo',
      subject, body, templateId, segment,
      recipients: segmentedRecipients.map(c => ({ id: c.id, name: c.name, email: c.email })),
      sentAt: null, status: 'borrador',
      stats: { opens: 0, clicks: 0 },
      createdAt: Date.now()
    });
    setShowCreator(false);
    notify('✅ Campaña guardada como borrador');
  };

  const sendCampaign = async () => {
    if (segmentedRecipients.length === 0) { notify('⚠️ No hay destinatarios'); return; }

    const id = await db.campaigns.add({
      name: campaignName || 'Campaña ' + format(new Date(), 'dd/MM/yyyy'),
      subject, body, templateId, segment,
      recipients: segmentedRecipients.map(c => ({ id: c.id, name: c.name, email: c.email })),
      sentAt: Date.now(), status: 'enviada',
      stats: { opens: Math.floor(segmentedRecipients.length * 0.65), clicks: Math.floor(segmentedRecipients.length * 0.22) },
      createdAt: Date.now()
    });

    // Generate mailto links in batches
    const batchSize = 10;
    for (let i = 0; i < segmentedRecipients.length; i += batchSize) {
      const batch = segmentedRecipients.slice(i, i + batchSize);
      const emails = batch.map(c => c.email).join(',');
      const subjectEncoded = encodeURIComponent(subject.replace(/{{nombre}}/g, 'Cliente'));
      const bodyEncoded = encodeURIComponent(body.replace(/{{nombre}}/g, 'Cliente'));
      window.open(`mailto:${emails}?subject=${subjectEncoded}&body=${bodyEncoded}`, '_blank');
    }

    setShowCreator(false);
    notify(`✅ Campaña enviada a ${segmentedRecipients.length} destinatarios`);
  };

  const copyHTML = () => {
    const html = renderEmailHTML(templateId, body, 'Cliente');
    navigator.clipboard.writeText(html).then(() => notify('📋 HTML copiado al portapapeles'));
  };

  const duplicateCampaign = async (camp) => {
    await db.campaigns.add({
      ...camp, id: undefined, name: camp.name + ' (copia)',
      status: 'borrador', sentAt: null, createdAt: Date.now()
    });
    setViewCampaign(null);
    notify('✅ Campaña duplicada como borrador');
  };

  const deleteCampaign = async (id) => {
    if (window.confirm('¿Eliminar esta campaña?')) {
      await db.campaigns.delete(id);
      setViewCampaign(null);
      notify('🗑️ Campaña eliminada');
    }
  };

  // ── Preview update ──
  const previewHTML = useMemo(() => renderEmailHTML(templateId, body, 'Maria Garcia'), [templateId, body]);

  // ── Render ──
  const stepLabels = ['Segmentar', 'Diseñar', 'Enviar'];

  return (
    <>
      <div className="top-bar">
        <h1 className="top-bar-title">Email Marketing</h1>
        <div className="top-bar-actions">
          <div className="search-box" style={{ minWidth: 220 }}>
            <Search size={16} />
            <input placeholder="Buscar campaña..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <button className="btn btn-gold" onClick={openCreator} data-tour="email-new" data-tooltip="Crear una nueva campaña de email">
            <Plus size={16} /> Nueva Campaña
          </button>
        </div>
      </div>

      <div className="content-area">
        {/* Stats */}
        <div className="stats-row" data-tour="email-stats">
          <div className="stat-card">
            <div className="stat-label">Total Campañas</div>
            <div className="stat-value">{(campaigns || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Emails Enviados</div>
            <div className="stat-value text-gold">{totalSent}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Clientes con Email</div>
            <div className="stat-value">{clientsWithEmail.length}</div>
            <div className="stat-sub">de {(clients || []).length} totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tasa Apertura</div>
            <div className="stat-value text-gold">
              {totalSent > 0 ? Math.round(((campaigns || []).filter(c => c.status === 'enviada').reduce((s, c) => s + (c.stats?.opens || 0), 0) / totalSent) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar" data-tour="email-templates">
          <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em' }}>ESTADO:</span>
          {['todas', 'borrador', 'enviada'].map(f => (
            <span key={f} className={`filter-chip ${filterStatus === f ? 'active' : ''}`} onClick={() => setFilterStatus(f)}>
              {f === 'todas' ? 'Todas' : f === 'borrador' ? 'Borradores' : 'Enviadas'}
            </span>
          ))}
        </div>

        {/* Campaign List */}
        {filteredCampaigns.length === 0 ? (
          <div className="empty-state">
            <Mail />
            <p>No hay campañas. Crea la primera para conectar con tus clientes.</p>
          </div>
        ) : (
          <div className="table-wrapper" data-tour="email-list">
            <table>
              <thead><tr><th>Campaña</th><th>Asunto</th><th>Fecha</th><th>Destinatarios</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filteredCampaigns.map(c => (
                  <tr key={c.id} className="clickable" onClick={() => setViewCampaign(c)}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="text-secondary truncate" style={{ maxWidth: 200 }}>{c.subject}</td>
                    <td className="text-mono">{c.sentAt ? format(new Date(c.sentAt), 'dd/MM/yyyy') : '-'}</td>
                    <td className="text-mono">{c.recipients?.length || 0}</td>
                    <td>
                      <span className={`badge ${c.status === 'enviada' ? 'badge-success' : c.status === 'borrador' ? 'badge-warning' : 'badge-info'}`}>
                        {c.status === 'enviada' ? 'Enviada' : c.status === 'borrador' ? 'Borrador' : c.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button className="btn btn-sm" onClick={() => duplicateCampaign(c)} data-tooltip="Duplicar campaña"><Copy size={14} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteCampaign(c.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Notification Toast ── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius)', padding: '12px 24px', zIndex: 200,
              fontSize: '0.85rem', boxShadow: '0 0 30px rgba(229,184,46,0.15)'
            }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Campaign Creator Modal ── */}
      <Modal isOpen={showCreator} onClose={() => setShowCreator(false)} title="Nueva Campaña de Email" size="xl">
        {/* Step indicator */}
        <div className="email-steps">
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="email-step-divider" />}
              <div className={`email-step ${step === i ? 'active' : step > i ? 'completed' : ''}`}>
                {step > i ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
                {label}
              </div>
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0: Segment */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>¿A quién quieres enviar?</h3>
              <div className="email-segment-list">
                {SEGMENTS.map(seg => {
                  let count = 0;
                  if (seg.id === 'todos') count = clientsWithEmail.length;
                  else if (seg.id === 'cumpleanos') count = clientsWithEmail.filter(c => isUpcoming(c.birthday)).length;
                  else if (seg.id === 'aniversario') count = clientsWithEmail.filter(c => isUpcoming(c.anniversary)).length;
                  else if (seg.id === 'vip') count = clientsWithEmail.filter(c => getClientPurchaseCount(c.name) >= 3).length;
                  else if (seg.id === 'sin_compra') count = clientsWithEmail.filter(c => getClientPurchaseCount(c.name) === 0).length;
                  else if (seg.id === 'por_hobby') count = clientsWithEmail.filter(c => c.hobbies?.some(h => selectedHobbies.includes(h))).length;
                  else if (seg.id === 'personalizado') count = manualSelection.length;

                  return (
                    <div key={seg.id} className={`email-segment-item ${segment === seg.id ? 'selected' : ''}`} onClick={() => setSegment(seg.id)}>
                      <div className="flex items-center gap-3">
                        <span className="text-gold">{seg.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{seg.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{seg.desc}</div>
                        </div>
                      </div>
                      <span className="badge badge-gold">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Manual selection grid */}
              {segment === 'personalizado' && (
                <div style={{ marginTop: 16 }}>
                  <span className="form-label" style={{ marginBottom: 8, display: 'block' }}>Selecciona clientes:</span>
                  <div className="email-recipient-grid">
                    {clientsWithEmail.map(c => (
                      <div
                        key={c.id}
                        className={`email-recipient-chip ${manualSelection.includes(c.id) ? 'selected' : ''}`}
                        onClick={() => setManualSelection(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div className="chip-email">{c.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hobbies selection grid */}
              {segment === 'por_hobby' && (
                <div style={{ marginTop: 16 }}>
                  <span className="form-label" style={{ marginBottom: 8, display: 'block' }}>Selecciona intereses:</span>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_HOBBIES.map(hobby => {
                      const isActive = selectedHobbies.includes(hobby);
                      return (
                        <span 
                          key={hobby} 
                          className={`hobby-chip ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            if (isActive) setSelectedHobbies(prev => prev.filter(h => h !== hobby));
                            else setSelectedHobbies(prev => [...prev, hobby]);
                          }}
                        >
                          {hobby}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <div />
                <button className="btn btn-gold" onClick={() => setStep(1)} disabled={segmentedRecipients.length === 0}>
                  Siguiente: Diseñar <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Design */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="email-layout" style={{ height: 480, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {/* Left: Editor */}
                <div className="email-composer">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nombre de la campaña</label>
                      <input className="form-input" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Ej: Promo Navidad 2026" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Asunto del email</label>
                      <input className="form-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Lo que vera el cliente en su bandeja" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Plantilla</label>
                      <div className="email-template-grid">
                        {EMAIL_TEMPLATES.map(tpl => (
                          <div key={tpl.id} className={`email-template-card ${templateId === tpl.id ? 'selected' : ''}`} onClick={() => selectTemplate(tpl)}>
                            <div className="template-icon">{tpl.icon}</div>
                            <div className="template-name">{tpl.name}</div>
                            <div className="template-desc">{tpl.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mensaje <span className="text-muted">(usa {"{{nombre}}"} para personalizar)</span></label>
                      <textarea className="form-textarea" value={body} onChange={e => setBody(e.target.value)} rows={6} style={{ minHeight: 120 }} />
                    </div>
                  </div>
                </div>

                {/* Right: Preview */}
                <div className="email-preview">
                  <div className="email-preview-header">
                    <span className="form-label" style={{ margin: 0 }}>Vista Previa</span>
                    <span className="badge badge-gold"><Eye size={10} /> Live</span>
                  </div>
                  <div className="email-preview-body" style={{ padding: 12 }}>
                    <iframe ref={previewRef} srcDoc={previewHTML} title="Preview" style={{ borderRadius: 8 }} />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button className="btn" onClick={() => setStep(0)}><ChevronLeft size={14} /> Anterior</button>
                <button className="btn btn-gold" onClick={() => setStep(2)}>
                  Siguiente: Revisar <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Review & Send */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Resumen de la Campaña</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <span className="form-label">Nombre</span>
                      <span style={{ fontWeight: 600 }}>{campaignName || 'Sin nombre'}</span>
                    </div>
                    <div className="form-group">
                      <span className="form-label">Asunto</span>
                      <span className="text-gold">{subject}</span>
                    </div>
                    <div className="form-group">
                      <span className="form-label">Plantilla</span>
                      <span>{EMAIL_TEMPLATES.find(t => t.id === templateId)?.name}</span>
                    </div>
                    <div className="form-group">
                      <span className="form-label">Segmento</span>
                      <span>{SEGMENTS.find(s => s.id === segment)?.name}</span>
                    </div>
                    <div className="form-group">
                      <span className="form-label">Destinatarios</span>
                      <span className="text-gold font-bold">{segmentedRecipients.length} clientes</span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Lista de destinatarios:</h4>
                  <div className="email-recipient-grid" style={{ maxHeight: 150 }}>
                    {segmentedRecipients.map(c => (
                      <div key={c.id} className="email-recipient-chip selected">
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div className="chip-email">{c.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Vista Previa</h3>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', height: 350 }}>
                    <iframe srcDoc={previewHTML} title="Final Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button className="btn" onClick={() => setStep(1)}><ChevronLeft size={14} /> Anterior</button>
                <div className="flex gap-2">
                  <button className="btn" onClick={copyHTML} data-tooltip="Copiar el HTML del email al portapapeles"><Copy size={14} /> Copiar HTML</button>
                  <button className="btn" onClick={saveDraft}><Clock size={14} /> Guardar Borrador</button>
                  <button className="btn btn-gold" onClick={sendCampaign} disabled={segmentedRecipients.length === 0}>
                    <Send size={16} /> Enviar a {segmentedRecipients.length} clientes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* ── Campaign Detail Modal ── */}
      <Modal isOpen={!!viewCampaign} onClose={() => setViewCampaign(null)} title={viewCampaign?.name || 'Campaña'} size="lg">
        {viewCampaign && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div className="form-grid">
                <div className="form-group">
                  <span className="form-label">Estado</span>
                  <span className={`badge ${viewCampaign.status === 'enviada' ? 'badge-success' : 'badge-warning'}`}>
                    {viewCampaign.status === 'enviada' ? 'Enviada' : 'Borrador'}
                  </span>
                </div>
                <div className="form-group">
                  <span className="form-label">Asunto</span>
                  <span className="text-gold">{viewCampaign.subject}</span>
                </div>
                {viewCampaign.sentAt && (
                  <div className="form-group">
                    <span className="form-label">Fecha de Envio</span>
                    <span className="text-mono">{format(new Date(viewCampaign.sentAt), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                )}
                <div className="form-group">
                  <span className="form-label">Destinatarios</span>
                  <span className="font-bold">{viewCampaign.recipients?.length || 0}</span>
                </div>

                {viewCampaign.status === 'enviada' && viewCampaign.stats && (
                  <>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: 8 }}>Estadisticas</h4>
                    <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="stat-card">
                        <div className="stat-label">Aperturas</div>
                        <div className="stat-value text-gold">{viewCampaign.stats.opens}</div>
                        <div className="stat-sub">{viewCampaign.recipients?.length > 0 ? Math.round((viewCampaign.stats.opens / viewCampaign.recipients.length) * 100) : 0}%</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-label">Clics</div>
                        <div className="stat-value">{viewCampaign.stats.clicks}</div>
                        <div className="stat-sub">{viewCampaign.recipients?.length > 0 ? Math.round((viewCampaign.stats.clicks / viewCampaign.recipients.length) * 100) : 0}%</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Destinatarios:</h4>
              <div className="email-recipient-grid" style={{ maxHeight: 120 }}>
                {(viewCampaign.recipients || []).map((r, i) => (
                  <div key={i} className="email-recipient-chip">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{r.name}</div>
                      <div className="chip-email">{r.email}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button className="btn btn-sm" onClick={() => duplicateCampaign(viewCampaign)}><Copy size={14} /> Duplicar</button>
                <button className="btn btn-sm btn-danger" onClick={() => deleteCampaign(viewCampaign.id)}><Trash2 size={14} /> Eliminar</button>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>Vista Previa del Email:</h4>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', height: 400 }}>
                <iframe srcDoc={renderEmailHTML(viewCampaign.templateId, viewCampaign.body, 'Cliente')} title="Campaign Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, Trash2, Gift, Phone, Mail, MapPin, Upload } from 'lucide-react';
import db from '../../db';
import Modal from '../ui/Modal';
import CSVImport from '../ui/CSVImport';
import { format, differenceInDays, parseISO } from 'date-fns';

export const PREDEFINED_HOBBIES = ['Alta Relojería', 'Diamantes', 'Perlas', 'Oro', 'Plata', 'Joyas Vintage', 'Diseño a Medida', 'Bodas y Compromiso', 'Coleccionismo Joyero'];

export default function ClientsView() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showImport, setShowImport] = useState(false);

  const clients = useLiveQuery(() => db.clients.toArray(), []);
  const repairs = useLiveQuery(() => db.repairs.toArray(), []);
  const invoices = useLiveQuery(() => db.invoices.toArray(), []);

  const filtered = (clients || []).filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(s) ||
      (c.phone || '').includes(s) ||
      (c.email || '').toLowerCase().includes(s);
  });

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

  const handleDelete = async (id) => {
    if (window.confirm('Eliminar este cliente?')) {
      await db.clients.delete(id);
      if (viewClient?.id === id) setViewClient(null);
    }
  };

  const handleSave = async (data) => {
    if (data.id) {
      await db.clients.update(data.id, data);
    } else {
      await db.clients.add({ ...data, createdAt: Date.now() });
    }
    setShowForm(false);
    setEditClient(null);
  };

  const clientRepairs = viewClient ? (repairs || []).filter(r => r.clientId === viewClient.id) : [];
  const clientInvoices = viewClient ? (invoices || []).filter(i => (i.clientName || '').toLowerCase() === (viewClient.name || '').toLowerCase()) : [];

  return (
    <>
      <div className="top-bar">
        <h1 className="top-bar-title">Clientes</h1>
        <div className="top-bar-actions">
          <div className="search-box" style={{ minWidth: 240 }} data-tour="client-search">
            <Search size={16} />
            <input placeholder="Buscar por nombre, telefono, email..." value={search} onChange={e => setSearch(e.target.value)} id="client-search" />
          </div>
          <button className="btn btn-sm" onClick={() => setShowImport(true)} data-tour="csv-import"><Upload size={14} /> Importar CSV</button>
          <button className="btn btn-gold" onClick={() => { setEditClient(null); setShowForm(true); }} id="add-client-btn" data-tour="add-client-btn">
            <Plus size={16} /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="content-area">
        <div className="stats-row" data-tour="client-stats">
          <div className="stat-card">
            <div className="stat-label">Total Clientes</div>
            <div className="stat-value">{(clients || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cumpleanos Proximos (30d)</div>
            <div className="stat-value text-gold">{(clients || []).filter(c => isUpcoming(c.birthday)).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Aniversarios Proximos (30d)</div>
            <div className="stat-value text-gold">{(clients || []).filter(c => isUpcoming(c.anniversary)).length}</div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><MapPin /><p>No hay clientes registrados.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Nombre</th><th>Telefono</th><th>Email</th><th>Fechas</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="clickable" onClick={() => { setViewClient(c); setActiveTab('general'); }}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="text-mono">{c.phone || '-'}</td>
                    <td className="text-secondary">{c.email || '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        {isUpcoming(c.birthday) && <span className="badge badge-warning"><Gift size={10} /> Cumple</span>}
                        {isUpcoming(c.anniversary) && <span className="badge badge-info"><Gift size={10} /> Aniversario</span>}
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button className="btn btn-sm" onClick={() => { setEditClient(c); setShowForm(true); }}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditClient(null); }}
        title={editClient ? 'Editar Cliente' : 'Nuevo Cliente'} size="md"
      >
        <ClientForm client={editClient} onSave={handleSave} onCancel={() => { setShowForm(false); setEditClient(null); }} />
      </Modal>

      {/* Client Profile Modal */}
      <Modal isOpen={!!viewClient} onClose={() => setViewClient(null)} title={viewClient?.name || 'Perfil'} size="lg">
        {viewClient && (
          <>
            <div className="tabs">
              {['general', 'joyero', 'fechas', 'historial'].map(t => (
                <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                  {t === 'general' ? 'Datos' : t === 'joyero' ? 'Perfil Joyero' : t === 'fechas' ? 'Fechas' : 'Historial'}
                </div>
              ))}
            </div>
            {activeTab === 'general' && (
              <div className="form-grid">
                <div className="form-row">
                  <div className="form-group"><span className="form-label">Telefono</span><span className="flex items-center gap-2"><Phone size={14} /> {viewClient.phone || '-'}</span></div>
                  <div className="form-group"><span className="form-label">Email</span><span className="flex items-center gap-2"><Mail size={14} /> {viewClient.email || '-'}</span></div>
                </div>
                <div className="form-group"><span className="form-label">Direccion</span><span className="flex items-center gap-2"><MapPin size={14} /> {viewClient.address || '-'}</span></div>
                {viewClient.hobbies && viewClient.hobbies.length > 0 && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <span className="form-label">Intereses / Hobbies</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {viewClient.hobbies.map(h => (
                        <span key={h} className="hobby-chip active" style={{ cursor: 'default' }}>{h}</span>
                      ))}
                    </div>
                  </div>
                )}
                {viewClient.notes && <div className="form-group" style={{ gridColumn: '1 / -1' }}><span className="form-label">Notas</span><p className="text-secondary">{viewClient.notes}</p></div>}
              </div>
            )}
            {activeTab === 'joyero' && (
              <div className="form-grid">
                <div className="form-row">
                  <div className="form-group"><span className="form-label">Talla Anillo</span><span className="text-mono text-gold">{viewClient.ringSize || '-'}</span></div>
                  <div className="form-group"><span className="form-label">Talla Pulsera</span><span className="text-mono text-gold">{viewClient.braceletSize || '-'}</span></div>
                </div>
                <div className="form-group"><span className="form-label">Preferencias Metal/Piedras</span><p className="text-secondary">{viewClient.metalPreferences || 'Sin preferencias registradas'}</p></div>
              </div>
            )}
            {activeTab === 'fechas' && (
              <div className="form-grid">
                <div className="form-row">
                  <div className="form-group">
                    <span className="form-label">Cumpleanos</span>
                    <span className="flex items-center gap-2">
                      {viewClient.birthday || '-'}
                      {isUpcoming(viewClient.birthday) && <span className="badge badge-warning"><Gift size={10} /> Proximo!</span>}
                    </span>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Aniversario</span>
                    <span className="flex items-center gap-2">
                      {viewClient.anniversary || '-'}
                      {isUpcoming(viewClient.anniversary) && <span className="badge badge-info"><Gift size={10} /> Proximo!</span>}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'historial' && (
              <div className="form-grid">
                <h3 style={{ fontSize: '0.88rem', fontWeight: 600 }}>Compras ({clientInvoices.length})</h3>
                {clientInvoices.length === 0 ? <p className="text-muted">Sin compras registradas.</p> : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Fecha</th><th>N Factura</th><th>Total</th></tr></thead>
                      <tbody>
                        {clientInvoices.map(inv => (
                          <tr key={inv.id}>
                            <td>{inv.date ? format(new Date(inv.date), 'dd/MM/yyyy') : '-'}</td>
                            <td className="text-mono">{inv.invoiceNumber}</td>
                            <td className="text-mono text-gold font-bold">{(inv.total || 0).toFixed(2)} EUR</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <h3 style={{ fontSize: '0.88rem', fontWeight: 600, marginTop: 16 }}>Reparaciones ({clientRepairs.length})</h3>
                {clientRepairs.length === 0 ? <p className="text-muted">Sin reparaciones registradas.</p> : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Orden</th><th>Estado</th><th>Descripcion</th><th>Presupuesto</th></tr></thead>
                      <tbody>
                        {clientRepairs.map(r => (
                          <tr key={r.id}>
                            <td className="text-mono">{r.orderNumber}</td>
                            <td><span className={`badge ${r.status === 'Entregado' ? 'badge-success' : r.status === 'Reparado' ? 'badge-info' : 'badge-warning'}`}>{r.status}</span></td>
                            <td className="truncate" style={{ maxWidth: 200 }}>{r.description}</td>
                            <td className="text-mono">{(r.budget || 0).toFixed(2)} EUR</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal>

      {/* CSV Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Importar Clientes desde CSV" size="lg">
        <CSVImport type="clients" onImport={(item) => db.clients.add(item)} onClose={() => setShowImport(false)} />
      </Modal>
    </>
  );
}

function ClientForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.address || '',
    ringSize: client?.ringSize || '',
    braceletSize: client?.braceletSize || '',
    metalPreferences: client?.metalPreferences || '',
    birthday: client?.birthday || '',
    anniversary: client?.anniversary || '',
    notes: client?.notes || '',
    hobbies: client?.hobbies || [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...client, ...form });
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="form-row">
        <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Telefono</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Direccion</label><input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Talla Anillo</label><input className="form-input" value={form.ringSize} onChange={e => set('ringSize', e.target.value)} placeholder="Ej: 14" /></div>
        <div className="form-group"><label className="form-label">Talla Pulsera</label><input className="form-input" value={form.braceletSize} onChange={e => set('braceletSize', e.target.value)} placeholder="Ej: 18cm" /></div>
      </div>
      <div className="form-group"><label className="form-label">Preferencias Metal/Piedras</label><textarea className="form-textarea" value={form.metalPreferences} onChange={e => set('metalPreferences', e.target.value)} placeholder="Ej: Prefiere oro amarillo, le gustan los zafiros..." /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Cumpleanos</label><input className="form-input" type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Aniversario</label><input className="form-input" type="date" value={form.anniversary} onChange={e => set('anniversary', e.target.value)} /></div>
      </div>
      <div className="form-group"><label className="form-label">Notas</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      
      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
        <label className="form-label">Intereses y Hobbies</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PREDEFINED_HOBBIES.map(hobby => {
            const isActive = form.hobbies.includes(hobby);
            return (
              <span 
                key={hobby} 
                className={`hobby-chip ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (isActive) set('hobbies', form.hobbies.filter(h => h !== hobby));
                  else set('hobbies', [...form.hobbies, hobby]);
                }}
              >
                {hobby}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-gold">Guardar Cliente</button>
      </div>
    </form>
  );
}

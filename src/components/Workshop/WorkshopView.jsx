import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Printer, Clock, Calendar, User, ChevronRight } from 'lucide-react';
import db from '../../db';
import Modal from '../ui/Modal';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

const statuses = [
  { id: 'Recibido', color: 'badge-info' },
  { id: 'En Taller', color: 'badge-warning' },
  { id: 'Reparado', color: 'badge-success' },
  { id: 'Entregado', color: 'badge-gold' },
];

export default function WorkshopView() {
  const [showForm, setShowForm] = useState(false);
  const [editRepair, setEditRepair] = useState(null);
  const [viewRepair, setViewRepair] = useState(null);

  const repairs = useLiveQuery(() => db.repairs.toArray(), []);
  const clients = useLiveQuery(() => db.clients.toArray(), []);

  const handleSave = async (data) => {
    if (data.id) {
      await db.repairs.update(data.id, data);
    } else {
      const count = (repairs || []).length;
      const orderNumber = `REP-${String(count + 1).padStart(4, '0')}`;
      await db.repairs.add({ ...data, orderNumber, status: 'Recibido', createdAt: Date.now() });
    }
    setShowForm(false);
    setEditRepair(null);
  };

  const changeStatus = async (repair, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'Entregado') updates.deliveryDate = new Date().toISOString();
    await db.repairs.update(repair.id, updates);
    if (viewRepair?.id === repair.id) setViewRepair({ ...repair, ...updates });
  };

  const printTicket = (repair) => {
    const doc = new jsPDF('p', 'mm', [80, 200]);
    doc.setFontSize(12);
    doc.text('JOYERIA LLAMAS', 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Estepa - Tel: 955 XXX XXX', 40, 16, { align: 'center' });
    doc.text('-------------------------------', 40, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('RESGUARDO DE TALLER', 40, 26, { align: 'center' });
    doc.setFontSize(8);
    doc.text('-------------------------------', 40, 30, { align: 'center' });
    let y = 36;
    doc.text(`Orden: ${repair.orderNumber}`, 5, y); y += 6;
    doc.text(`Cliente: ${repair.clientName || '-'}`, 5, y); y += 6;
    doc.text(`Fecha: ${repair.entryDate || '-'}`, 5, y); y += 6;
    doc.text(`Entrega est.: ${repair.estimatedDate || '-'}`, 5, y); y += 8;
    doc.text('Descripcion:', 5, y); y += 5;
    const lines = doc.splitTextToSize(repair.description || '-', 70);
    doc.text(lines, 5, y); y += lines.length * 4 + 4;
    doc.text(`Presupuesto: ${(repair.budget || 0).toFixed(2)} EUR`, 5, y); y += 6;
    doc.text(`Deposito: ${(repair.deposit || 0).toFixed(2)} EUR`, 5, y); y += 8;
    doc.text('-------------------------------', 40, y, { align: 'center' }); y += 6;
    doc.setFontSize(7);
    doc.text('Conserve este resguardo.', 40, y, { align: 'center' }); y += 4;
    doc.text('Imprescindible para la recogida.', 40, y, { align: 'center' });
    doc.save(`resguardo_${repair.orderNumber}.pdf`);
  };

  return (
    <>
      <div className="top-bar">
        <h1 className="top-bar-title">Taller de Reparaciones</h1>
        <div className="top-bar-actions">
          <button className="btn btn-gold" onClick={() => { setEditRepair(null); setShowForm(true); }} data-tour="add-repair-btn">
            <Plus size={16} /> Nueva Reparacion
          </button>
        </div>
      </div>

      <div className="content-area">
        {/* Kanban Board */}
        <div className="kanban-board" data-tour="workshop-kanban">
          {statuses.map(status => {
            const cards = (repairs || []).filter(r => r.status === status.id);
            return (
              <div className="kanban-column" key={status.id}>
                <div className="kanban-header">
                  <span className="kanban-title">{status.id}</span>
                  <span className="kanban-count">{cards.length}</span>
                </div>
                <div className="kanban-cards">
                  <AnimatePresence>
                    {cards.map(r => (
                      <motion.div
                        key={r.id}
                        className="kanban-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => setViewRepair(r)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-mono text-gold" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{r.orderNumber}</span>
                          <span className={`badge ${status.color}`}>{status.id}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>{r.clientName || 'Sin cliente'}</div>
                        <p className="text-secondary truncate" style={{ fontSize: '0.75rem', marginBottom: 8 }}>{r.description}</p>
                        <div className="flex items-center justify-between" style={{ fontSize: '0.72rem' }}>
                          <span className="text-muted flex items-center gap-2"><Calendar size={12} />{r.estimatedDate || '-'}</span>
                          <span className="text-mono text-gold">{(r.budget || 0).toFixed(2)} EUR</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button className="btn btn-sm" style={{ fontSize: '0.68rem' }} onClick={(e) => { e.stopPropagation(); printTicket(r); }}>
                            <Printer size={12} /> Ticket
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {cards.length === 0 && <div className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center', padding: 20 }}>Vacio</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Form */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditRepair(null); }}
        title={editRepair ? 'Editar Arreglo' : 'Nuevo Arreglo'} size="lg"
      >
        <RepairForm repair={editRepair} clients={clients || []} onSave={handleSave} onCancel={() => { setShowForm(false); setEditRepair(null); }} />
      </Modal>

      {/* View Detail */}
      <Modal isOpen={!!viewRepair} onClose={() => setViewRepair(null)} title={`Orden ${viewRepair?.orderNumber || ''}`} size="md">
        {viewRepair && (
          <div className="form-grid">
            <div className="form-row">
              <div className="form-group"><span className="form-label">Cliente</span><span>{viewRepair.clientName || '-'}</span></div>
              <div className="form-group"><span className="form-label">Estado</span>
                <select className="form-select" value={viewRepair.status}
                  onChange={(e) => changeStatus(viewRepair, e.target.value)}>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><span className="form-label">Descripcion</span><p className="text-secondary">{viewRepair.description}</p></div>
            <div className="form-row">
              <div className="form-group"><span className="form-label">Fecha Entrada</span><span>{viewRepair.entryDate || '-'}</span></div>
              <div className="form-group"><span className="form-label">Entrega Estimada</span><span>{viewRepair.estimatedDate || '-'}</span></div>
            </div>
            <div className="form-row">
              <div className="form-group"><span className="form-label">Presupuesto</span><span className="text-mono text-gold font-bold">{(viewRepair.budget || 0).toFixed(2)} EUR</span></div>
              <div className="form-group"><span className="form-label">Deposito</span><span className="text-mono">{(viewRepair.deposit || 0).toFixed(2)} EUR</span></div>
            </div>
            {viewRepair.notes && <div className="form-group"><span className="form-label">Notas</span><p className="text-secondary">{viewRepair.notes}</p></div>}
            <div className="flex gap-2 mt-4">
              <button className="btn btn-gold" onClick={() => printTicket(viewRepair)}><Printer size={14} /> Imprimir Resguardo</button>
              <button className="btn" onClick={() => { setViewRepair(null); setEditRepair(viewRepair); setShowForm(true); }}>Editar</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function RepairForm({ repair, clients, onSave, onCancel }) {
  const [form, setForm] = useState({
    clientId: repair?.clientId || '',
    clientName: repair?.clientName || '',
    description: repair?.description || '',
    entryDate: repair?.entryDate || new Date().toISOString().split('T')[0],
    estimatedDate: repair?.estimatedDate || '',
    budget: repair?.budget || '',
    deposit: repair?.deposit || '',
    notes: repair?.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleClientSelect = (e) => {
    const id = parseInt(e.target.value);
    const client = clients.find(c => c.id === id);
    set('clientId', id);
    set('clientName', client ? client.name : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...repair,
      ...form,
      budget: parseFloat(form.budget) || 0,
      deposit: parseFloat(form.deposit) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Cliente</label>
          <select className="form-select" value={form.clientId} onChange={handleClientSelect}>
            <option value="">Seleccionar cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">O nombre manual</label>
          <input className="form-input" value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Nombre del cliente" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Descripcion del estado de la pieza *</label>
        <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} required
          placeholder="Ej: Falta una piedra en el engaste central, cadena rota en el cierre..." style={{ minHeight: 100 }} />
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Fecha de Entrada</label><input className="form-input" type="date" value={form.entryDate} onChange={e => set('entryDate', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Entrega Estimada</label><input className="form-input" type="date" value={form.estimatedDate} onChange={e => set('estimatedDate', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Presupuesto (EUR)</label><input className="form-input" type="number" step="0.01" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label className="form-label">Deposito / Senal (EUR)</label><input className="form-input" type="number" step="0.01" value={form.deposit} onChange={e => set('deposit', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-group"><label className="form-label">Notas internas</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-gold">Guardar Arreglo</button>
      </div>
    </form>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Eye, FileText, TrendingUp, Receipt } from 'lucide-react';
import db from '../../db';
import Modal from '../ui/Modal';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function InvoicesView() {
  const [viewInvoice, setViewInvoice] = useState(null);
  const invoices = useLiveQuery(() => db.invoices.orderBy('date').reverse().toArray(), []);
  const settingsArray = useLiveQuery(() => db.settings.toArray(), []);
  const settings = (settingsArray || []).reduce((acc, curr) => ({...acc, [curr.key]: curr.value}), {});

  const list = invoices || [];
  const dailyTotal = list.filter(i => isToday(new Date(i.date))).reduce((s, i) => s + (i.total || 0), 0);
  const weeklyTotal = list.filter(i => isThisWeek(new Date(i.date))).reduce((s, i) => s + (i.total || 0), 0);
  const monthlyIVA = list.filter(i => isThisMonth(new Date(i.date))).reduce((s, i) => s + (i.ivaAmount || 0), 0);

  const downloadPDF = (inv) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text((settings.storeName || 'JOYERIA LLAMAS').toUpperCase(), 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${settings.storeSubtitle || ''} - CIF: ${settings.cif || 'Sin configurar'}`, 105, 27, { align: 'center' });
    if (settings.address) doc.text(settings.address, 105, 33, { align: 'center' });
    if (settings.phone || settings.email) doc.text(`Tel: ${settings.phone || '-'} | Email: ${settings.email || '-'}`, 105, 39, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Factura: ${inv.invoiceNumber}`, 20, 52);
    doc.setFontSize(10);
    doc.text(`Fecha: ${format(new Date(inv.date), 'dd/MM/yyyy HH:mm')}`, 20, 59);
    doc.text(`Metodo: ${inv.paymentMethod || '-'}`, 20, 65);
    if (inv.clientName) {
      doc.text(`Cliente: ${inv.clientName}`, 20, 71);
      if (inv.clientNIF) doc.text(`NIF/CIF: ${inv.clientNIF}`, 20, 77);
    }

    const items = (inv.items || []).map(it => {
      const lineTotal = (it.price || 0) * (it.qty || 1);
      const disc = lineTotal * ((it.discount || 0) / 100);
      return [it.name, it.sku || '-', it.qty || 1, `${(it.price || 0).toFixed(2)}`, `${(it.discount || 0)}%`, `${(lineTotal - disc).toFixed(2)}`];
    });

    doc.autoTable({
      startY: 85,
      head: [['Articulo', 'SKU', 'Cant.', 'Precio', 'Dto.', 'Total']],
      body: items,
      theme: 'grid',
      headStyles: { fillColor: [229, 184, 46], textColor: [10, 10, 10] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${(inv.subtotal || 0).toFixed(2)} EUR`, 140, finalY);
    doc.text(`IVA (${inv.ivaRate || 21}%): ${(inv.ivaAmount || 0).toFixed(2)} EUR`, 140, finalY + 6);
    doc.setFontSize(13);
    doc.text(`TOTAL: ${(inv.total || 0).toFixed(2)} EUR`, 140, finalY + 14);
    doc.save(`factura_${inv.invoiceNumber}.pdf`);
  };

  return (
    <>
      <div className="top-bar">
        <h1 className="top-bar-title">Facturas</h1>
      </div>

      <div className="content-area">
        {/* Stats Dashboard */}
        <div className="stats-row" data-tour="invoices-dashboard">
          <div className="stat-card">
            <div className="stat-label">Ventas Hoy</div>
            <div className="stat-value">{dailyTotal.toFixed(2)} EUR</div>
            <div className="stat-sub">Jornada actual</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ventas Semana</div>
            <div className="stat-value">{weeklyTotal.toFixed(2)} EUR</div>
            <div className="stat-sub">Semana en curso</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">IVA Recaudado (Mes)</div>
            <div className="stat-value">{monthlyIVA.toFixed(2)} EUR</div>
            <div className="stat-sub">Mes actual</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Facturas</div>
            <div className="stat-value">{list.length}</div>
          </div>
        </div>

        {/* Invoice List */}
        {list.length === 0 ? (
          <div className="empty-state"><Receipt /><p>No hay facturas registradas.</p></div>
        ) : (
          <div className="table-wrapper" data-tour="invoices-list">
            <table>
              <thead>
                <tr>
                  <th>N Factura</th><th>Fecha</th><th>Cliente</th>
                  <th>Metodo</th><th>Base</th><th>IVA</th><th>Total</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.map(inv => (
                  <tr key={inv.id} className="clickable" onClick={() => setViewInvoice(inv)}>
                    <td className="text-mono text-gold font-bold">{inv.invoiceNumber}</td>
                    <td>{inv.date ? format(new Date(inv.date), 'dd/MM/yyyy HH:mm') : '-'}</td>
                    <td>{inv.clientName || '-'}</td>
                    <td><span className={`badge ${inv.paymentMethod === 'efectivo' ? 'badge-success' : inv.paymentMethod === 'tarjeta' ? 'badge-info' : 'badge-warning'}`}>{inv.paymentMethod || '-'}</span></td>
                    <td className="text-mono">{(inv.subtotal || 0).toFixed(2)}</td>
                    <td className="text-mono text-secondary">{(inv.ivaAmount || 0).toFixed(2)}</td>
                    <td className="text-mono text-gold font-bold">{(inv.total || 0).toFixed(2)} EUR</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm" onClick={() => downloadPDF(inv)}>
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <Modal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)}
        title={`Factura ${viewInvoice?.invoiceNumber || ''}`} size="lg"
        footer={
          viewInvoice && (
            <button className="btn btn-gold" onClick={() => downloadPDF(viewInvoice)}>
              <Download size={14} /> Descargar PDF
            </button>
          )
        }
      >
        {viewInvoice && (
          <div className="form-grid">
            <div className="form-row">
              <div className="form-group"><span className="form-label">Numero</span><span className="text-mono text-gold font-bold">{viewInvoice.invoiceNumber}</span></div>
              <div className="form-group"><span className="form-label">Fecha</span><span>{format(new Date(viewInvoice.date), 'dd/MM/yyyy HH:mm')}</span></div>
              <div className="form-group"><span className="form-label">Metodo</span><span className="badge badge-gold">{viewInvoice.paymentMethod}</span></div>
            </div>
            {viewInvoice.clientName && (
              <div className="form-group"><span className="form-label">Cliente</span><span>{viewInvoice.clientName}</span></div>
            )}

            <div className="table-wrapper mt-4">
              <table>
                <thead><tr><th>Articulo</th><th>Precio</th><th>Cant.</th><th>Dto.</th><th>Total Linea</th></tr></thead>
                <tbody>
                  {(viewInvoice.items || []).map((it, idx) => {
                    const lineTotal = (it.price || 0) * (it.qty || 1);
                    const disc = lineTotal * ((it.discount || 0) / 100);
                    return (
                      <tr key={idx}>
                        <td>{it.name}</td>
                        <td className="text-mono">{(it.price || 0).toFixed(2)}</td>
                        <td className="text-mono">{it.qty || 1}</td>
                        <td className="text-mono">{it.discount || 0}%</td>
                        <td className="text-mono text-gold font-bold">{(lineTotal - disc).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div className="flex items-center gap-4"><span className="text-secondary">Subtotal:</span><span className="text-mono">{(viewInvoice.subtotal || 0).toFixed(2)} EUR</span></div>
              <div className="flex items-center gap-4"><span className="text-secondary">IVA ({viewInvoice.ivaRate || 21}%):</span><span className="text-mono">{(viewInvoice.ivaAmount || 0).toFixed(2)} EUR</span></div>
              <div className="flex items-center gap-4" style={{ fontSize: '1.2rem', fontWeight: 700 }}><span>TOTAL:</span><span className="text-mono text-gold">{(viewInvoice.total || 0).toFixed(2)} EUR</span></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

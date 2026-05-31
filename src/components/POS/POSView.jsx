import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle, ShoppingCart, User, X
} from 'lucide-react';
import db from '../../db';

const quickServices = [
  { name: 'Limpieza de joyas', price: 15 },
  { name: 'Cambio de pila', price: 8 },
  { name: 'Ajuste de talla', price: 25 },
  { name: 'Soldadura', price: 30 },
  { name: 'Grabado', price: 20 },
  { name: 'Pulido', price: 12 },
];

const categoryQuick = ['Anillos', 'Collares', 'Pendientes', 'Pulseras', 'Relojes'];

export default function POSView() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashReceived, setCashReceived] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [catFilter, setCatFilter] = useState(null);
  const [ivaEnabled, setIvaEnabled] = useState(true);

  // Client Selection
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientResults, setShowClientResults] = useState(false);

  const products = useLiveQuery(() => db.products.toArray(), []);
  const clients = useLiveQuery(() => db.clients.toArray(), []);

  const filteredClients = (clients || []).filter(c => {
    if (!clientSearch) return false;
    const s = clientSearch.toLowerCase();
    return (c.name || '').toLowerCase().includes(s) || (c.phone || '').includes(s) || (c.email || '').toLowerCase().includes(s);
  }).slice(0, 5);

  const filtered = (products || []).filter(p => {
    if (!p) return false;
    const matchSearch = !search ||
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat && (p.stock || 0) > 0;
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id && c.type === 'product');
      if (existing) {
        return prev.map(c => c.id === item.id && c.type === 'product'
          ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1, discount: 0, type: 'product' }];
    });
  };

  const addService = (service) => {
    const id = 'svc-' + Date.now();
    setCart(prev => [...prev, { id, name: service.name, price: service.price, qty: 1, discount: 0, type: 'service' }]);
  };

  const updateQty = (idx, delta) => {
    setCart(prev => prev.map((c, i) => {
      if (i !== idx) return c;
      const newQty = Math.max(1, c.qty + delta);
      return { ...c, qty: newQty };
    }));
  };

  const updateDiscount = (idx, val) => {
    setCart(prev => prev.map((c, i) => i === idx ? { ...c, discount: parseFloat(val) || 0 } : c));
  };

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((sum, c) => {
    const lineTotal = c.price * c.qty;
    const disc = lineTotal * (c.discount / 100);
    return sum + lineTotal - disc;
  }, 0);

  const ivaRate = ivaEnabled ? 21 : 0;
  const ivaAmount = subtotal * (ivaRate / 100);
  const total = subtotal + ivaAmount;
  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - total;

  const completeSale = async (method) => {
    if (cart.length === 0) return;

    // Update stock for products
    for (const item of cart) {
      if (item.type === 'product' && item.id) {
        const product = await db.products.get(item.id);
        if (product) {
          await db.products.update(item.id, { stock: Math.max(0, (product.stock || 0) - item.qty) });
        }
      }
    }

    // Create invoice
    const count = await db.invoices.count();
    const invoiceNumber = `FAC-${String(count + 1).padStart(5, '0')}`;
    await db.invoices.add({
      invoiceNumber,
      date: Date.now(),
      items: cart.map(c => ({
        name: c.name, sku: c.sku || '', price: c.price,
        qty: c.qty, discount: c.discount, type: c.type,
      })),
      subtotal,
      ivaRate,
      ivaAmount,
      total,
      paymentMethod: method,
      type: 'venta',
      clientId: selectedClient?.id || null,
      clientName: selectedClient?.name || '',
      clientNIF: selectedClient?.nif || '',
      createdAt: Date.now(),
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setPaymentMethod(null);
      setCashReceived('');
      setSelectedClient(null);
      setClientSearch('');
    }, 2000);
  };

  return (
    <div className="pos-layout" style={{ height: 'calc(100vh - 0px)' }}>
      {/* LEFT - Search & Products */}
      <div className="pos-left">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Terminal Punto de Venta</h2>

        <div className="search-box" style={{ marginBottom: 16 }} data-tour="pos-search">
          <Search size={16} />
          <input placeholder="Buscar por SKU o nombre..." value={search} onChange={e => setSearch(e.target.value)} autoFocus id="pos-search" />
        </div>

        {/* Category quick filters */}
        <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          <span className={`filter-chip ${!catFilter ? 'active' : ''}`} onClick={() => setCatFilter(null)}>Todos</span>
          {categoryQuick.map(c => (
            <span key={c} className={`filter-chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</span>
          ))}
        </div>

        {/* Quick Services */}
        <div style={{ marginBottom: 20 }} data-tour="pos-quick-services">
          <span className="form-label" style={{ marginBottom: 8, display: 'block' }}>Servicios Rapidos</span>
          <div className="pos-quick-grid">
            {quickServices.map(s => (
              <div key={s.name} className="pos-quick-btn" onClick={() => addService(s)}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div className="text-gold text-mono" style={{ fontSize: '0.82rem', marginTop: 4 }}>{s.price.toFixed(2)} EUR</div>
              </div>
            ))}
          </div>
        </div>

        {/* Product results */}
        <span className="form-label" style={{ marginBottom: 8, display: 'block' }}>Articulos ({filtered.length})</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
          {filtered.map(p => (
            <motion.div
              key={p.id}
              className="pos-quick-btn"
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(p)}
              style={{ textAlign: 'left' }}
            >
              <div className="text-mono text-muted" style={{ fontSize: '0.65rem' }}>{p.sku || '-'}</div>
              <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{p.name}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gold text-mono font-bold">{(p.price || 0).toFixed(2)}</span>
                <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>x{p.stock}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RIGHT - Ticket */}
      <div className="pos-right">
        <div className="pos-ticket-header">
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Ticket de Venta</h3>
            <span className="badge badge-gold">{cart.length} art.</span>
          </div>
        </div>

        <div className="pos-ticket-items" data-tour="pos-ticket">
          <AnimatePresence>
            {cart.map((item, idx) => (
              <motion.div
                key={item.id + '-' + idx}
                className="pos-item"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.name}</div>
                  <div className="text-mono text-muted" style={{ fontSize: '0.7rem' }}>{(item.price || 0).toFixed(2)} EUR x {item.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-icon btn-sm" onClick={() => updateQty(idx, -1)}><Minus size={12} /></button>
                  <span className="text-mono" style={{ minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                  <button className="btn btn-icon btn-sm" onClick={() => updateQty(idx, 1)}><Plus size={12} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="form-input"
                    style={{ width: 50, padding: '4px 6px', fontSize: '0.72rem', textAlign: 'center' }}
                    type="number" min="0" max="100" value={item.discount}
                    onChange={e => updateDiscount(idx, e.target.value)}
                    title="Descuento %"
                  />
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>%</span>
                </div>
                <button className="btn btn-icon btn-sm btn-danger" onClick={() => removeItem(idx)}><Trash2 size={12} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <ShoppingCart />
              <p>Anade articulos al ticket</p>
            </div>
          )}
        </div>

        <div className="pos-ticket-footer">
          {/* Client Selection */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            {selectedClient ? (
              <div className="flex items-center justify-between bg-gold-muted" style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gold" />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedClient.name}</span>
                </div>
                <button className="btn btn-icon btn-sm text-muted" onClick={() => setSelectedClient(null)}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div className="search-box" style={{ padding: '6px 10px' }}>
                  <User size={14} />
                  <input
                    placeholder="Asignar cliente (Opcional)..."
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setShowClientResults(true); }}
                    onFocus={() => setShowClientResults(true)}
                  />
                  {clientSearch && <X size={14} className="cursor-pointer" onClick={() => setClientSearch('')} />}
                </div>
                {showClientResults && clientSearch && filteredClients.length > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', boxShadow: '0 -4px 12px rgba(0,0,0,0.2)',
                    zIndex: 20, maxHeight: 150, overflowY: 'auto'
                  }}>
                    {filteredClients.map(c => (
                      <div
                        key={c.id}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                        onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientResults(false); }}
                        className="hover:bg-gold-muted"
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{c.phone || c.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4" style={{ fontSize: '0.82rem' }}>
            <span className="text-secondary">Subtotal</span>
            <span className="text-mono">{subtotal.toFixed(2)} EUR</span>
          </div>
          <div className="flex items-center justify-between mb-4" style={{ fontSize: '0.82rem' }}>
            <div className="flex items-center gap-2" data-tour="pos-iva">
              <span className="text-secondary">IVA ({ivaRate}%)</span>
              <button
                onClick={() => setIvaEnabled(v => !v)}
                style={{
                  position: 'relative', width: 36, height: 20, borderRadius: 10,
                  background: ivaEnabled ? 'var(--gold)' : 'var(--border)',
                  border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                  flexShrink: 0,
                }}
                title={ivaEnabled ? 'Desactivar IVA' : 'Activar IVA'}
              >
                <span style={{
                  position: 'absolute', top: 2, left: ivaEnabled ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: ivaEnabled ? '#0a0a0a' : 'var(--text-muted)',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
            <span className="text-mono" style={{ opacity: ivaEnabled ? 1 : 0.35 }}>{ivaAmount.toFixed(2)} EUR</span>
          </div>
          <div className="flex items-center justify-between mb-4" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            <span>TOTAL</span>
            <span className="text-gold text-mono">{total.toFixed(2)} EUR</span>
          </div>

          {/* Payment */}
          {!paymentMethod ? (
            <div className="flex gap-2" data-tour="pos-payment">
              <button className="btn btn-gold flex-1" onClick={() => setPaymentMethod('efectivo')} disabled={cart.length === 0}>
                <Banknote size={16} /> Efectivo
              </button>
              <button className="btn btn-gold flex-1" onClick={() => completeSale('tarjeta')} disabled={cart.length === 0}>
                <CreditCard size={16} /> Tarjeta
              </button>
              <button className="btn flex-1" onClick={() => setPaymentMethod('mixto')} disabled={cart.length === 0}>
                Mixto
              </button>
            </div>
          ) : paymentMethod === 'efectivo' ? (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Efectivo Recibido (EUR)</label>
                <input className="form-input" type="number" step="0.01" value={cashReceived} onChange={e => setCashReceived(e.target.value)} autoFocus placeholder="0.00" />
              </div>
              {cashAmount >= total && (
                <div className="flex items-center justify-between" style={{ padding: '8px 14px', background: 'rgba(52,211,153,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <span className="text-success" style={{ fontWeight: 600 }}>Cambio</span>
                  <span className="text-mono text-success font-bold" style={{ fontSize: '1.2rem' }}>{change.toFixed(2)} EUR</span>
                </div>
              )}
              <div className="flex gap-2">
                <button className="btn" onClick={() => { setPaymentMethod(null); setCashReceived(''); }}>Cancelar</button>
                <button className="btn btn-gold flex-1" onClick={() => completeSale('efectivo')} disabled={cashAmount < total}>
                  <CheckCircle size={16} /> Confirmar Pago
                </button>
              </div>
            </div>
          ) : (
            <div className="form-grid">
              <p className="text-secondary" style={{ fontSize: '0.82rem' }}>Pago Mixto: registrar el total con metodo mixto.</p>
              <div className="flex gap-2">
                <button className="btn" onClick={() => setPaymentMethod(null)}>Cancelar</button>
                <button className="btn btn-gold flex-1" onClick={() => completeSale('mixto')}>
                  <CheckCircle size={16} /> Confirmar Mixto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Success overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, background: 'rgba(6,6,8,0.95)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                <CheckCircle size={64} color="#34d399" />
              </motion.div>
              <p style={{ marginTop: 16, fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>Venta Completada!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

const categories = ['Anillos', 'Collares', 'Pendientes', 'Pulseras', 'Relojes', 'Otros'];
const metalOptions = ['Oro 18k', 'Oro 14k', 'Plata 925', 'Platino', 'Acero', 'Otro'];

export default function ProductForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || categories[0],
    metal: product?.metal || metalOptions[0],
    weight: product?.weight || '',
    gemType: product?.gemType || '',
    carats: product?.carats || '',
    buyingPrice: product?.buyingPrice || '',
    price: product?.price || '',
    stock: product?.stock || '',
    lowStockAlert: product?.lowStockAlert || '2',
    supplier: product?.supplier || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const autoSKU = () => {
    const prefix = (form.category || 'ART').substring(0, 3).toUpperCase();
    const ts = Date.now().toString(36).toUpperCase().slice(-5);
    set('sku', `${prefix}-${ts}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...product,
      ...form,
      weight: parseFloat(form.weight) || 0,
      carats: parseFloat(form.carats) || 0,
      buyingPrice: parseFloat(form.buyingPrice) || 0,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      lowStockAlert: parseInt(form.lowStockAlert) || 2,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      {/* SKU */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">SKU / Referencia</label>
          <div className="flex gap-2">
            <input className="form-input flex-1" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Ej: ANI-AB12C" />
            <button type="button" className="btn btn-sm" onClick={autoSKU} data-tooltip="Genera un codigo unico basado en la categoria y fecha">
              <Sparkles size={14} /> Auto
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Nombre del articulo" />
        </div>
      </div>

      {/* Category & Metal */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Metal</label>
          <select className="form-select" value={form.metal} onChange={e => set('metal', e.target.value)}>
            {metalOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Weight, Gem, Carats */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Peso (gramos)</label>
          <input className="form-input" type="number" step="0.01" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de Gema</label>
          <input className="form-input" value={form.gemType} onChange={e => set('gemType', e.target.value)} placeholder="Diamante, Rubi..." />
        </div>
        <div className="form-group">
          <label className="form-label">Quilates</label>
          <input className="form-input" type="number" step="0.01" value={form.carats} onChange={e => set('carats', e.target.value)} placeholder="0.00" />
        </div>
      </div>

      {/* Prices */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Precio Coste (EUR)</label>
          <input className="form-input" type="number" step="0.01" value={form.buyingPrice} onChange={e => set('buyingPrice', e.target.value)} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="form-label">PVP (EUR)</label>
          <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="0.00" />
        </div>
      </div>

      {/* Stock */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Stock</label>
          <input className="form-input" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Alerta Stock Bajo</label>
          <input className="form-input" type="number" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} placeholder="2" />
        </div>
        <div className="form-group">
          <label className="form-label">Proveedor</label>
          <input className="form-input" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Nombre proveedor" />
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Descripcion</label>
        <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripcion breve del articulo..." />
      </div>

      <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-gold">Guardar Articulo</button>
      </div>
    </form>
  );
}

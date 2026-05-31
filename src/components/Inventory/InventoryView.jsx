import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus, Search, Grid, List, Download, Upload, AlertTriangle, Trash2, Eye, Package
} from 'lucide-react';
import db from '../../db';
import ProductForm from './ProductForm';
import Modal from '../ui/Modal';
import CSVImport from '../ui/CSVImport';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const categories = ['Todos', 'Anillos', 'Collares', 'Pendientes', 'Pulseras', 'Relojes', 'Otros'];
const metals = ['Todos', 'Oro 18k', 'Oro 14k', 'Plata 925', 'Platino', 'Acero', 'Otro'];

export default function InventoryView() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [metal, setMetal] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const products = useLiveQuery(() => {
    let col = db.products.toCollection();
    return col.toArray();
  }, []);

  const filtered = (products || []).filter(p => {
    if (!p) return false;
    const matchSearch = !search ||
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Todos' || p.category === category;
    const matchMetal = metal === 'Todos' || p.metal === metal;
    return matchSearch && matchCat && matchMetal;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Eliminar este articulo permanentemente?')) {
      await db.products.delete(id);
    }
  };

  const exportCSV = () => {
    const headers = ['SKU', 'Nombre', 'Categoria', 'Metal', 'Peso(g)', 'PVP', 'Stock'];
    const rows = filtered.map(p => [p.sku, p.name, p.category, p.metal, p.weight, p.price, p.stock]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'catalogo_llamas.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text('CATALOGO - JOYERIA LLAMAS', 148, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Estepa', 148, 28, { align: 'center' });
    const tableData = filtered.map(p => [
      p.sku || '-', p.name || '-', p.category || '-',
      p.metal || '-', (p.weight || 0) + 'g',
      (p.price || 0).toFixed(2) + ' EUR', p.stock || 0
    ]);
    doc.autoTable({
      startY: 35,
      head: [['SKU', 'Nombre', 'Categoria', 'Metal', 'Peso', 'PVP', 'Stock']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [229, 184, 46], textColor: [10, 10, 10] },
    });
    doc.save('catalogo_llamas.pdf');
  };

  const handleSave = async (data) => {
    if (data.id) {
      await db.products.update(data.id, data);
    } else {
      await db.products.add({ ...data, createdAt: Date.now() });
    }
    setShowForm(false);
    setEditProduct(null);
  };

  return (
    <>
      <div className="top-bar">
        <h1 className="top-bar-title">Inventario</h1>
        <div className="top-bar-actions">
          <div className="search-box" style={{ minWidth: 220 }}>
            <Search size={16} />
            <input
              placeholder="Buscar por SKU o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="inventory-search"
            />
          </div>
          <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-gold' : ''}`} onClick={() => setViewMode('grid')}>
            <Grid size={14} />
          </button>
          <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-gold' : ''}`} onClick={() => setViewMode('list')}>
            <List size={14} />
          </button>
          <button className="btn btn-sm" onClick={exportCSV} data-tooltip="Descargar todo el inventario en formato Excel/CSV"><Download size={14} /> CSV</button>
          <button className="btn btn-sm" onClick={exportPDF} data-tooltip="Generar catalogo en PDF para imprimir"><Download size={14} /> PDF</button>
          <button className="btn btn-sm" onClick={() => setShowImport(true)} data-tour="csv-import" data-tooltip="Cargar datos masivos desde un archivo"><Upload size={14} /> Importar CSV</button>
          <button className="btn btn-gold" onClick={() => { setEditProduct(null); setShowForm(true); }} id="add-product-btn" data-tour="inventory-add" data-tooltip="Crear una nueva pieza en el catalogo">
            <Plus size={16} /> Nuevo Articulo
          </button>
        </div>
      </div>

      <div className="content-area">
        {/* Stats */}
        <div className="stats-row" data-tour="inventory-stats">
          <div className="stat-card">
            <div className="stat-label">Total Articulos</div>
            <div className="stat-value">{(products || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Valor Inventario</div>
            <div className="stat-value">{(products || []).reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0).toLocaleString()} EUR</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Stock Bajo</div>
            <div className="stat-value text-danger">
              {(products || []).filter(p => p.stock <= (p.lowStockAlert || 2)).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar" data-tour="inventory-filters">
          <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em' }}>CATEGORIA:</span>
          {categories.map(c => (
            <span key={c} className={`filter-chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</span>
          ))}
          <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', marginLeft: 12 }}>METAL:</span>
          {metals.map(m => (
            <span key={m} className={`filter-chip ${metal === m ? 'active' : ''}`} onClick={() => setMetal(m)}>{m}</span>
          ))}
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Package />
            <p>No hay articulos. Anade el primero.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="product-grid">
            <AnimatePresence>
              {filtered.map(p => (
                <motion.div
                  key={p.id}
                  className="product-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setViewProduct(p)}
                >
                  {p.stock <= (p.lowStockAlert || 2) && (
                    <div className="product-card-stock">
                      <span className="badge badge-danger low-stock-pulse">
                        <AlertTriangle size={10} /> Stock bajo
                      </span>
                    </div>
                  )}
                  <div className="product-card-sku">{p.sku || 'Sin SKU'}</div>
                  <div className="product-card-name">{p.name}</div>
                  <div className="product-card-meta">{p.category} - {p.metal} - {p.weight || 0}g</div>
                  <div className="flex items-center justify-between">
                    <div className="product-card-price">{(p.price || 0).toLocaleString()} EUR</div>
                    <span className="badge badge-gold">Stock: {p.stock || 0}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>SKU</th><th>Nombre</th><th>Categoria</th><th>Metal</th>
                  <th>Peso</th><th>Coste</th><th>PVP</th><th>Stock</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="clickable" onClick={() => setViewProduct(p)}>
                    <td className="text-mono text-muted">{p.sku || '-'}</td>
                    <td>{p.name}</td>
                    <td><span className="badge badge-gold">{p.category}</span></td>
                    <td>{p.metal}</td>
                    <td className="text-mono">{p.weight || 0}g</td>
                    <td className="text-mono text-secondary">{(p.buyingPrice || 0).toFixed(2)}</td>
                    <td className="text-mono text-gold font-bold">{(p.price || 0).toFixed(2)}</td>
                    <td>
                      {p.stock <= (p.lowStockAlert || 2) ? (
                        <span className="badge badge-danger low-stock-pulse"><AlertTriangle size={10} /> {p.stock}</span>
                      ) : (
                        <span className="badge badge-success">{p.stock}</span>
                      )}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button className="btn btn-sm" onClick={() => { setEditProduct(p); setShowForm(true); }}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditProduct(null); }}
        title={editProduct ? 'Editar Articulo' : 'Nuevo Articulo'} size="lg"
      >
        <ProductForm product={editProduct} onSave={handleSave} onCancel={() => { setShowForm(false); setEditProduct(null); }} />
      </Modal>

      {/* View Detail Modal */}
      <Modal isOpen={!!viewProduct} onClose={() => setViewProduct(null)} title={viewProduct?.name || 'Detalle'} size="md">
        {viewProduct && (
          <div className="form-grid">
            <div className="form-row">
              <div className="form-group"><span className="form-label">SKU</span><span className="text-mono">{viewProduct.sku || '-'}</span></div>
              <div className="form-group"><span className="form-label">Categoria</span><span>{viewProduct.category}</span></div>
            </div>
            <div className="form-row">
              <div className="form-group"><span className="form-label">Metal</span><span>{viewProduct.metal}</span></div>
              <div className="form-group"><span className="form-label">Peso</span><span className="text-mono">{viewProduct.weight || 0}g</span></div>
            </div>
            <div className="form-row">
              <div className="form-group"><span className="form-label">Gema</span><span>{viewProduct.gemType || '-'}</span></div>
              <div className="form-group"><span className="form-label">Quilates</span><span className="text-mono">{viewProduct.carats || '-'}</span></div>
            </div>
            <div className="form-row">
              <div className="form-group"><span className="form-label">Coste</span><span className="text-mono">{(viewProduct.buyingPrice || 0).toFixed(2)} EUR</span></div>
              <div className="form-group"><span className="form-label">PVP</span><span className="text-mono text-gold font-bold">{(viewProduct.price || 0).toFixed(2)} EUR</span></div>
            </div>
            <div className="form-row">
              <div className="form-group"><span className="form-label">Stock</span><span className="text-mono">{viewProduct.stock || 0}</span></div>
              <div className="form-group"><span className="form-label">Alerta Stock Bajo</span><span className="text-mono">{viewProduct.lowStockAlert || 2}</span></div>
            </div>
            {viewProduct.description && (
              <div className="form-group"><span className="form-label">Descripcion</span><p className="text-secondary">{viewProduct.description}</p></div>
            )}
            <div className="flex gap-2 mt-4">
              <button className="btn btn-gold" onClick={() => { setViewProduct(null); setEditProduct(viewProduct); setShowForm(true); }}>Editar</button>
              <button className="btn btn-danger" onClick={() => { handleDelete(viewProduct.id); setViewProduct(null); }}>Eliminar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* CSV Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Importar Articulos desde CSV" size="lg">
        <CSVImport type="products" onImport={(item) => db.products.add(item)} onClose={() => setShowImport(false)} />
      </Modal>
    </>
  );
}

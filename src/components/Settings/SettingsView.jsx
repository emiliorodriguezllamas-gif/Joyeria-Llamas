import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Download, Upload, AlertCircle } from 'lucide-react';
import db from '../../db';
import { exportDB, importInto } from 'dexie-export-import';
import { format } from 'date-fns';

export default function SettingsView() {
  const [form, setForm] = useState({
    storeName: 'Joyeria Llamas',
    storeSubtitle: 'Estepa - desde 1970',
    cif: '',
    address: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    // Load settings
    const loadSettings = async () => {
      try {
        const settings = await db.settings.toArray();
        if (settings.length > 0) {
          const loaded = { ...form };
          settings.forEach(s => { loaded[s.key] = s.value; });
          setForm(loaded);
        }
      } catch (err) {
        console.error("No se pudieron cargar los ajustes", err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const keys = Object.keys(form);
      for (const key of keys) {
        const existing = await db.settings.where('key').equals(key).first();
        if (existing) {
          await db.settings.update(existing.id, { value: form[key] });
        } else {
          await db.settings.add({ key, value: form[key] });
        }
      }
      setMsg({ type: 'success', text: 'Ajustes guardados correctamente.' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Error al guardar ajustes.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportDB(db, { prettyJson: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_joyeria_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ type: 'success', text: 'Copia de seguridad exportada con éxito.' });
    } catch (error) {
      console.error(error);
      setMsg({ type: 'error', text: 'Error al exportar la base de datos.' });
    } finally {
      setExporting(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('¿Estás seguro de que quieres restaurar esta copia de seguridad? ESTO SOBRESCRIBIRÁ TODOS LOS DATOS ACTUALES.')) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      // Import the database
      await db.delete();
      await db.open();
      await importInto(db, file, { clearTablesBeforeImport: true });
      setMsg({ type: 'success', text: 'Copia de seguridad restaurada correctamente. Recarga la aplicación.' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error(error);
      setMsg({ type: 'error', text: 'Error al restaurar la base de datos. Archivo inválido.' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="top-bar">
        <h1 className="top-bar-title">Configuración</h1>
      </div>

      <div className="content-area" style={{ maxWidth: 800 }}>
        
        {msg.text && (
          <div className={`p-4 rounded mb-4 ${msg.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{msg.text}</span>
          </div>
        )}

        {/* Sección de Datos de la Tienda */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} className="text-gold" />
            Datos Fiscales (Facturación)
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
            Estos datos aparecerán en la cabecera de las facturas generadas en PDF.
          </p>

          <form onSubmit={handleSave} className="form-grid">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre de la Tienda *</label>
                <input className="form-input" value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subtítulo / Eslogan</label>
                <input className="form-input" value={form.storeSubtitle} onChange={e => setForm({...form, storeSubtitle: e.target.value})} placeholder="Ej: Estepa - desde 1970" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">CIF / NIF *</label>
                <input className="form-input" value={form.cif} onChange={e => setForm({...form, cif: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección Completa *</label>
              <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email de Contacto</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Datos'}
              </button>
            </div>
          </form>
        </div>

        {/* Sección de Backups */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} className="text-gold" />
            Copias de Seguridad (Backups)
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
            Tus datos (clientes, inventario, facturas) se guardan localmente en este ordenador. 
            Te recomendamos exportar una copia de seguridad semanalmente y guardarla en un pendrive o en la nube por seguridad.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button className="btn" onClick={handleExport} disabled={exporting}>
              <Download size={16} /> {exporting ? 'Exportando...' : 'Exportar Copia de Seguridad'}
            </button>

            <label className="btn" style={{ cursor: importing ? 'wait' : 'pointer', background: 'var(--bg-input)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              <Upload size={16} /> {importing ? 'Restaurando...' : 'Restaurar Copia'}
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} disabled={importing} />
            </label>
          </div>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 12 }}>
            ⚠️ Restaurar una copia de seguridad sobrescribirá todos los datos actuales del programa de forma irreversible.
          </p>
        </div>

      </div>
    </>
  );
}

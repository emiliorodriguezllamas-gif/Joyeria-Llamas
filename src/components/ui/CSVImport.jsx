import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(sep).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (vals.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx]; });
      rows.push(obj);
    }
  }
  return { headers, rows };
}

const FIELD_MAPS = {
  products: {
    label: 'Articulos',
    fields: [
      { key: 'sku', label: 'SKU', type: 'text' },
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripcion', type: 'text' },
      { key: 'category', label: 'Categoria', type: 'text' },
      { key: 'metal', label: 'Metal', type: 'text' },
      { key: 'weight', label: 'Peso (g)', type: 'number' },
      { key: 'gemType', label: 'Tipo Gema', type: 'text' },
      { key: 'carats', label: 'Quilates', type: 'number' },
      { key: 'buyingPrice', label: 'Precio Coste', type: 'number' },
      { key: 'price', label: 'PVP', type: 'number', required: true },
      { key: 'stock', label: 'Stock', type: 'number' },
      { key: 'lowStockAlert', label: 'Alerta Stock', type: 'number' },
      { key: 'supplier', label: 'Proveedor', type: 'text' },
    ],
    template: 'sku,name,description,category,metal,weight,gemType,carats,buyingPrice,price,stock,lowStockAlert,supplier\nANI-001,Anillo Solitario,,Anillos,Oro 18k,4.5,Diamante,0.5,800,1500,5,2,Proveedor1',
  },
  clients: {
    label: 'Clientes',
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'phone', label: 'Telefono', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Direccion', type: 'text' },
      { key: 'ringSize', label: 'Talla Anillo', type: 'text' },
      { key: 'braceletSize', label: 'Talla Pulsera', type: 'text' },
      { key: 'metalPreferences', label: 'Preferencias', type: 'text' },
      { key: 'birthday', label: 'Cumpleanos (YYYY-MM-DD)', type: 'text' },
      { key: 'anniversary', label: 'Aniversario (YYYY-MM-DD)', type: 'text' },
      { key: 'notes', label: 'Notas', type: 'text' },
    ],
    template: 'name,phone,email,address,ringSize,braceletSize,metalPreferences,birthday,anniversary,notes\nMaria Garcia,955123456,maria@email.com,Calle Mayor 1,14,18cm,Oro amarillo,1990-05-15,,Cliente VIP',
  },
};

export default function CSVImport({ type, onImport, onClose }) {
  const config = FIELD_MAPS[type];
  const fileRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload | map | preview | done
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [mapping, setMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [importResult, setImportResult] = useState({ success: 0, errors: 0 });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setCsvData(parsed);
      // Auto-map matching headers
      const autoMap = {};
      config.fields.forEach(f => {
        const match = parsed.headers.find(h =>
          h.toLowerCase() === f.key.toLowerCase() ||
          h.toLowerCase() === f.label.toLowerCase()
        );
        if (match) autoMap[f.key] = match;
      });
      setMapping(autoMap);
      setStep('map');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const applyMapping = () => {
    const mapped = csvData.rows.map(row => {
      const obj = {};
      config.fields.forEach(f => {
        const csvCol = mapping[f.key];
        let val = csvCol ? (row[csvCol] || '') : '';
        if (f.type === 'number') val = parseFloat(val) || 0;
        obj[f.key] = val;
      });
      obj.createdAt = Date.now();
      return obj;
    });
    setPreviewData(mapped);
    setStep('preview');
  };

  const doImport = async () => {
    let success = 0, errors = 0;
    for (const item of previewData) {
      try {
        await onImport(item);
        success++;
      } catch {
        errors++;
      }
    }
    setImportResult({ success, errors });
    setStep('done');
  };

  const downloadTemplate = () => {
    const blob = new Blob([config.template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: 200 }}>
      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="form-grid">
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Importa {config.label.toLowerCase()} desde un archivo CSV. El archivo debe tener una fila de cabeceras y usar coma o punto y coma como separador.
          </p>

          <button className="btn" onClick={downloadTemplate} style={{ alignSelf: 'flex-start' }}>
            <Download size={14} /> Descargar Plantilla CSV
          </button>

          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Upload size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>Haz clic para seleccionar archivo CSV</p>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>o arrastra el archivo aqui</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* Step: Map columns */}
      {step === 'map' && (
        <div className="form-grid">
          <div className="flex items-center justify-between">
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
              <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              {csvData.rows.length} filas detectadas. Asigna las columnas del CSV a los campos del sistema.
            </p>
          </div>

          <div className="table-wrapper" style={{ maxHeight: 350, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Campo del Sistema</th>
                  <th>Columna CSV</th>
                  <th>Ejemplo</th>
                </tr>
              </thead>
              <tbody>
                {config.fields.map(f => (
                  <tr key={f.key}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{f.label}</span>
                      {f.required && <span className="text-danger" style={{ marginLeft: 4 }}>*</span>}
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={mapping[f.key] || ''}
                        onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      >
                        <option value="">-- No asignar --</option>
                        {csvData.headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-mono text-muted" style={{ fontSize: '0.75rem' }}>
                      {mapping[f.key] && csvData.rows[0] ? csvData.rows[0][mapping[f.key]] || '-' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setStep('upload')}>Atras</button>
            <button className="btn btn-gold" onClick={applyMapping}>
              Vista Previa ({csvData.rows.length} registros)
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="form-grid">
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Vista previa de los {previewData.length} registros a importar. Verifica que los datos son correctos.
          </p>

          <div className="table-wrapper" style={{ maxHeight: 350, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {config.fields.slice(0, 6).map(f => <th key={f.key}>{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 20).map((item, i) => (
                  <tr key={i}>
                    <td className="text-mono text-muted">{i + 1}</td>
                    {config.fields.slice(0, 6).map(f => (
                      <td key={f.key} className={f.type === 'number' ? 'text-mono' : ''}>
                        {item[f.key] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
                {previewData.length > 20 && (
                  <tr><td colSpan={7} className="text-muted" style={{ textAlign: 'center' }}>... y {previewData.length - 20} mas</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setStep('map')}>Atras</button>
            <button className="btn btn-gold" onClick={doImport}>
              <Upload size={14} /> Importar {previewData.length} Registros
            </button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
            <CheckCircle size={48} color="#34d399" style={{ margin: '0 auto' }} />
          </motion.div>
          <p style={{ marginTop: 16, fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
            Importacion Completada
          </p>
          <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.88rem' }}>
            {importResult.success} registros importados correctamente
            {importResult.errors > 0 && <span className="text-danger"> | {importResult.errors} errores</span>}
          </p>
          <button className="btn btn-gold mt-4" onClick={onClose}>Cerrar</button>
        </div>
      )}
    </div>
  );
}

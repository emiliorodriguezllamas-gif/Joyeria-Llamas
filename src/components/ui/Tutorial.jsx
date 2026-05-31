import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, ChevronLeft, X } from 'lucide-react';

const sectionSteps = {
  inventory: [
    { target: '[data-tour="sidebar"]', title: "Navegacion", content: "Muevete entre modulos desde este menu lateral.", position: "right" },
    { target: '[data-tour="inventory-stats"]', title: "Estadisticas", content: "Resumen del valor de tu inventario y alertas de stock bajo.", position: "bottom" },
    { target: '[data-tour="inventory-filters"]', title: "Filtros Rapidos", content: "Encuentra articulos filtrando por categoria o metal al instante.", position: "bottom" },
    { target: '[data-tour="csv-import"]', title: "Importar", content: "Carga datos masivos desde Excel/CSV facilmente.", position: "bottom" },
    { target: '[data-tour="inventory-add"]', title: "Nuevo Articulo", content: "Añade piezas individualmente. ¡Usa el boton 'Auto' para generar el SKU!", position: "bottom" }
  ],
  clients: [
    { target: '[data-tour="client-stats"]', title: "Panel de Clientes", content: "Avisos de cumpleaños y aniversarios en los proximos 30 dias.", position: "bottom" },
    { target: '[data-tour="client-search"]', title: "Buscador", content: "Localiza clientes por nombre, telefono o email.", position: "bottom" },
    { target: '[data-tour="add-client-btn"]', title: "Añadir Cliente", content: "Registra nuevos clientes. Podras guardar sus tallas de anillo y preferencias.", position: "bottom" }
  ],
  workshop: [
    { target: '[data-tour="workshop-kanban"]', title: "Tablero Kanban", content: "Visualiza todas las reparaciones. Arrastra las tarjetas o haz clic para cambiarlas de estado.", position: "right" },
    { target: '[data-tour="add-repair-btn"]', title: "Nueva Reparacion", content: "Crea una orden de trabajo, vinculala a un cliente y genera el ticket de resguardo.", position: "bottom" }
  ],
  pos: [
    { target: '[data-tour="pos-search"]', title: "Buscador de Articulos", content: "Escanea o escribe el SKU/nombre para añadir al ticket.", position: "bottom" },
    { target: '[data-tour="pos-quick-services"]', title: "Servicios Rapidos", content: "Añade arreglos comunes (pilas, limpieza) con un solo clic.", position: "bottom" },
    { target: '[data-tour="pos-ticket"]', title: "Ticket de Venta", content: "Ajusta cantidades o aplica descuentos por linea de articulo.", position: "left" },
    { target: '[data-tour="pos-iva"]', title: "Control de IVA", content: "Activa o desactiva el IVA general de la venta con este interruptor.", position: "top" },
    { target: '[data-tour="pos-payment"]', title: "Cobro", content: "Finaliza la venta. Elige efectivo para que calcule el cambio automaticamente.", position: "top" }
  ],
  invoices: [
    { target: '[data-tour="invoices-dashboard"]', title: "Dashboard Financiero", content: "Ventas de hoy, de la semana y el IVA acumulado del mes.", position: "bottom" },
    { target: '[data-tour="invoices-list"]', title: "Historial de Facturas", content: "Registro inmutable de ventas. Puedes descargar el PDF de cualquier ticket antiguo.", position: "top" }
  ],
  email: [
    { target: '[data-tour="email-stats"]', title: "Panel de Campañas", content: "Resumen de tus envios: total de campañas, emails enviados y clientes disponibles.", position: "bottom" },
    { target: '[data-tour="email-new"]', title: "Nueva Campaña", content: "Crea emails personalizados en 3 pasos: segmenta, diseña y envia.", position: "bottom" },
    { target: '[data-tour="email-templates"]', title: "Plantillas", content: "Elige entre plantillas profesionales: promociones, cumpleaños, aniversarios o nueva coleccion.", position: "bottom" },
    { target: '[data-tour="email-list"]', title: "Historial", content: "Consulta todas tus campañas anteriores, duplicalas o revisa sus estadisticas.", position: "top" }
  ]
};

export default function Tutorial({ section = 'inventory', onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const steps = sectionSteps[section] || sectionSteps['inventory'];
  const step = steps[currentStep];

  useEffect(() => {
    const updatePosition = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        
        // Quitar resalte de otros
        document.querySelectorAll('.tutorial-highlight').forEach(e => e.classList.remove('tutorial-highlight'));
        // Añadir resalte al actual
        el.classList.add('tutorial-highlight');

        let top = rect.top;
        let left = rect.left;

        if (step.position === 'right') {
          left = rect.right + 20;
          top = rect.top;
        } else if (step.position === 'bottom') {
          top = rect.bottom + 20;
          left = rect.left;
        }
        
        // Ajustar para que no salga de la pantalla
        const cardWidth = 340; // Ancho aproximado + margen
        const cardHeight = 220; // Alto aproximado + margen
        
        if (left + cardWidth > window.innerWidth) {
          left = Math.max(20, window.innerWidth - cardWidth);
        }
        if (top + cardHeight > window.innerHeight) {
          top = Math.max(20, window.innerHeight - cardHeight);
        }
        
        // Si sigue fuera por la izquierda/arriba (pantallas muy pequeñas)
        if (left < 20) left = 20;
        if (top < 20) top = 20;

        setCoords({ top, left });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      document.querySelectorAll('.tutorial-highlight').forEach(e => e.classList.remove('tutorial-highlight'));
    };
  }, [currentStep]);

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
    else finish();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const finish = () => {
    document.querySelectorAll('.tutorial-highlight').forEach(e => e.classList.remove('tutorial-highlight'));
    onFinish();
  };

  return (
    <>
      <div className="tutorial-overlay" onClick={finish} />
      <motion.div 
        className="tutorial-step-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0, top: coords.top, left: coords.left }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-gold" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
            Paso {currentStep + 1} de {steps.length}
          </span>
          <button className="btn btn-icon btn-sm" onClick={finish}><X size={14} /></button>
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 20 }}>{step.content}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  width: 6, height: 6, borderRadius: '50%', 
                  background: i === currentStep ? 'var(--gold)' : 'var(--border)' 
                }} 
              />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button className="btn btn-sm" onClick={prev}>
                <ChevronLeft size={14} /> Anterior
              </button>
            )}
            <button className="btn btn-sm btn-gold" onClick={next}>
              {currentStep === steps.length - 1 ? "Finalizar" : "Siguiente"} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

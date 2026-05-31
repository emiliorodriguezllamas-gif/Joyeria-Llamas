import React from 'react';
import { motion } from 'framer-motion';
import {
  Package, Users, Wrench, Monitor, FileText, Menu, X, HelpCircle, Mail, Settings
} from 'lucide-react';

const navItems = [
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'workshop', label: 'Taller', icon: Wrench },
  { id: 'pos', label: 'TPV', icon: Monitor },
  { id: 'invoices', label: 'Facturas', icon: FileText },
  { id: 'email', label: 'Email Marketing', icon: Mail },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ activeView, onNavigate, isOpen, onToggle, onHelp }) {
  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn btn-icon"
        onClick={onToggle}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 110,
          display: 'none',
        }}
        id="sidebar-toggle"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} data-tour="sidebar">
        <div className="sidebar-header">
          <div className="logo-text">Joyeria Llamas</div>
          <div className="logo-sub">Estepa - desde 1970</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <motion.div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              data-tour={item.id === 'pos' ? 'pos-nav' : item.id === 'workshop' ? 'workshop-nav' : undefined}
              onClick={() => {
                onNavigate(item.id);
                if (window.innerWidth <= 768) onToggle();
              }}
              whileTap={{ scale: 0.97 }}
            >
              <item.icon />
              <span>{item.label}</span>
            </motion.div>
          ))}
          
          <div style={{ flex: 1 }} />
          
          <motion.div
            className="nav-item"
            style={{ color: 'var(--gold)', marginTop: 'auto' }}
            onClick={() => {
              onHelp();
              if (window.innerWidth <= 768) onToggle();
            }}
            whileTap={{ scale: 0.97 }}
          >
            <HelpCircle />
            <span>Ayuda y Tutorial</span>
          </motion.div>
        </nav>

        <div className="sidebar-footer">
          ERP v1.0 - Llamas
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && window.innerWidth <= 768 && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 90,
          }}
          onClick={onToggle}
        />
      )}
    </>
  );
}

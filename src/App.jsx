import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import InventoryView from './components/Inventory/InventoryView';
import ClientsView from './components/Clients/ClientsView';
import WorkshopView from './components/Workshop/WorkshopView';
import POSView from './components/POS/POSView';
import InvoicesView from './components/Invoices/InvoicesView';
import EmailMarketingView from './components/Email/EmailMarketingView';
import SettingsView from './components/Settings/SettingsView';
import Tutorial from './components/ui/Tutorial';
import { HelpCircle } from 'lucide-react';

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
};

export default function App() {
  const [activeView, setActiveView] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('tutorial_completed');
  });

  const renderView = () => {
    switch (activeView) {
      case 'inventory': return <InventoryView />;
      case 'clients': return <ClientsView />;
      case 'workshop': return <WorkshopView />;
      case 'pos': return <POSView />;
      case 'invoices': return <InvoicesView />;
      case 'email': return <EmailMarketingView />;
      case 'settings': return <SettingsView />;
      default: return <InventoryView />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        onHelp={() => setShowTutorial(true)}
      />
      <main className="main-content">

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            {...pageTransition}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showTutorial && (
        <Tutorial section={activeView} onFinish={() => {
          setShowTutorial(false);
          localStorage.setItem('tutorial_completed_' + activeView, 'true');
        }} />
      )}
    </div>
  );
}

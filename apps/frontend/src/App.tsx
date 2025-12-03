import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';

// Lazy load page components for code splitting and better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const VaultCreation = lazy(() => import('./pages/VaultCreation'));
const Loans = lazy(() => import('./pages/Loans'));
const Licensing = lazy(() => import('./pages/Licensing'));
const MyLicensesPage = lazy(() => import('./pages/MyLicensesPage'));
const IPIntelligencePage = lazy(() => import('./pages/IPIntelligencePage'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-orange-500 text-xl">Loading...</div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedIPAsset, setSelectedIPAsset] = useState<string | null>(null);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);

  const handleNavigate = (page: string, data?: string) => {
    setCurrentPage(page);
    // Handle different data types based on the page
    if (page === 'ip-intelligence' && data) {
      setSelectedIPAsset(data);
    } else if (page === 'licensing' && data) {
      setSelectedVault(data);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'vault':
        return <VaultCreation onNavigate={handleNavigate} />;
      case 'loans':
        return <Loans onNavigate={handleNavigate} />;
      case 'licensing':
        return <Licensing onNavigate={handleNavigate} preSelectedVault={selectedVault || undefined} />;
      case 'my-licenses':
        return <MyLicensesPage onNavigate={handleNavigate} />;
      case 'ip-intelligence':
        return <IPIntelligencePage ipAssetId={selectedIPAsset} onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={<PageLoader />}>
            {renderPage()}
          </Suspense>
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </div>
  );
}

export default App;

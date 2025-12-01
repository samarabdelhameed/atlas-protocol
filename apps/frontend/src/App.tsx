import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';

// Lazy load page components for code splitting and better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const VaultCreation = lazy(() => import('./pages/VaultCreation'));
const Loans = lazy(() => import('./pages/Loans'));
const Licensing = lazy(() => import('./pages/Licensing'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-orange-500 text-xl">Loading...</div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />;
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'vault':
        return <VaultCreation onNavigate={setCurrentPage} />;
      case 'loans':
        return <Loans onNavigate={setCurrentPage} />;
      case 'licensing':
        return <Licensing onNavigate={setCurrentPage} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
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

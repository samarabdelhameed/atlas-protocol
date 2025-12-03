import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Vault, CreditCard, Brain, LayoutDashboard, FileText, Menu, X } from "lucide-react";
import { ConnectKitButton } from "connectkit";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navigation = memo(function Navigation({
  currentPage,
  onNavigate,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "landing", label: "Home", icon: Globe },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "vault", label: "Vault", icon: Vault },
    { id: "loans", label: "Loans", icon: CreditCard },
    { id: "licensing", label: "Licensing", icon: Brain },
    { id: "my-licenses", label: "My Licenses", icon: FileText },
  ];

  const handleNavigation = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/50 overflow-hidden">
              <img src="/logo.png" alt="Atlas Protocol" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-lg sm:text-xl">Atlas Protocol</h1>
              <p className="text-xs text-gray-400">IP Data Oracle • Story L1</p>
            </div>
            <h1 className="sm:hidden text-white font-bold text-base">Atlas</h1>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`relative px-3 xl:px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    isActive ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg border border-orange-500/30"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="text-sm font-medium relative z-10">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ConnectKitButton />
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-white/10 bg-black/50 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.button>
                );
              })}

              {/* Mobile Wallet Connect */}
              <div className="pt-4 border-t border-white/10 sm:hidden">
                <ConnectKitButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
});

export default Navigation;

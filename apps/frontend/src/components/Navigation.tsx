import { memo } from "react";
import { motion } from "framer-motion";
import { Globe, Vault, CreditCard, Brain, LayoutDashboard } from "lucide-react";
import { ConnectKitButton } from "connectkit";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navigation = memo(function Navigation({
  currentPage,
  onNavigate,
}: NavigationProps) {
  const navItems = [
    { id: "landing", label: "Home", icon: Globe },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "vault", label: "Vault", icon: Vault },
    { id: "loans", label: "Loans", icon: CreditCard },
    { id: "licensing", label: "Licensing", icon: Brain },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/50 overflow-hidden">
              <img src="/logo.png" alt="Atlas Protocol" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Atlas Protocol</h1>
              <p className="text-xs text-gray-400">IP Data Oracle • Story L1</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
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
                  <span className="text-sm font-medium relative z-10 hidden md:block">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center">
            <ConnectKitButton />
          </div>
        </div>
      </div>
    </motion.nav>
  );
});

export default Navigation;

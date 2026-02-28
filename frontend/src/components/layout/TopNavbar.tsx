import { Search, Bell, Wallet, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function TopNavbar() {
  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 bg-card/80 backdrop-blur-lg sticky top-0 z-30 flex items-center justify-between px-6 gap-4 border-b border-border"
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search energy, producers, cities..."
            className="w-full h-9 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Live Ticker */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15 text-sm">
        <Zap className="w-3.5 h-3.5 text-primary animate-pulse-glow" />
        <span className="text-muted-foreground text-xs">Renewable flowing:</span>
        <span className="font-semibold text-primary text-xs font-heading">12,430 kWh</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-saffron" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm">
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground text-xs">₹2,840</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-gradient-tri" />
      </div>
    </motion.header>
  );
}

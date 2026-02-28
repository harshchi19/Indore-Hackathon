import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Brain, Leaf, TrendingUp, Factory, MapPin, Zap, ChevronLeft, ChevronRight, Rocket, Calendar, Globe,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
  { title: "AI Brain", url: "/ai-brain", icon: Brain },
  { title: "Smart City", url: "/smart-city", icon: MapPin },
  { title: "Future Sim", url: "/future", icon: Calendar },
  { title: "Investor Zone", url: "/investor", icon: TrendingUp },
  { title: "Carbon Credits", url: "/carbon", icon: Leaf },
  { title: "EIP Simulator", url: "/eip", icon: Globe },
  { title: "Producer Mode", url: "/producer", icon: Factory },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[230px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 glossy">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-heading font-bold text-base text-foreground tracking-tight">GreenGrid</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link key={item.title} to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative",
                isActive ? "bg-primary/10 text-foreground sidebar-active" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
              <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-3 p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* User */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Arjun S.</p>
            <p className="text-xs text-muted-foreground truncate">Producer</p>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

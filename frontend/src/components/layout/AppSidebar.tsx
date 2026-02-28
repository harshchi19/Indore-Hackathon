import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Brain, Leaf, TrendingUp, Factory, MapPin, Zap, ChevronLeft, ChevronRight, Calendar, Globe,
  Users, ShoppingBag, Plug, Award, DollarSign, CreditCard, ShieldCheck, Scale, Settings, Bell,
  User, FileText, History, Wallet, UsersRound, HelpCircle, PlusCircle, ChevronDown,
  Home, ArrowLeftRight, Banknote, TreePine, BarChart3, UserCircle, Wrench, LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUser, useClerk, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Main",
    icon: Home,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
      { title: "Producers", url: "/producers", icon: Users },
    ],
  },
  {
    label: "Trading",
    icon: ArrowLeftRight,
    items: [
      { title: "Buy Energy", url: "/buy-energy", icon: ShoppingBag },
      { title: "Sell Energy", url: "/producer", icon: Factory },
      { title: "Create Listing", url: "/create-listing", icon: PlusCircle },
      { title: "Contracts", url: "/contracts", icon: FileText },
      { title: "Trading History", url: "/history", icon: History },
      { title: "Pricing & Auctions", url: "/pricing", icon: DollarSign },
    ],
  },
  {
    label: "Finance",
    icon: Banknote,
    items: [
      { title: "Wallet", url: "/wallet", icon: Wallet },
      { title: "Payments", url: "/payments", icon: CreditCard },
      { title: "Investor Zone", url: "/investor", icon: TrendingUp },
    ],
  },
  {
    label: "Green Impact",
    icon: TreePine,
    items: [
      { title: "Certificates", url: "/certificates", icon: Award },
      { title: "Carbon Impact", url: "/carbon", icon: Leaf },
      { title: "Smart Meter", url: "/smart-meter", icon: Plug },
    ],
  },
  {
    label: "Analytics & AI",
    icon: BarChart3,
    items: [
      { title: "AI Brain", url: "/ai-brain", icon: Brain },
      { title: "Smart City", url: "/smart-city", icon: MapPin },
      { title: "Future Sim", url: "/future", icon: Calendar },
      { title: "EIP Simulator", url: "/eip", icon: Globe },
    ],
  },
  {
    label: "Account",
    icon: UserCircle,
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "KYC", url: "/kyc", icon: ShieldCheck },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Community", url: "/community", icon: UsersRound },
    ],
  },
  {
    label: "Administration",
    icon: Wrench,
    items: [
      { title: "Admin Console", url: "/admin", icon: Settings },
      { title: "Disputes", url: "/disputes", icon: Scale },
      { title: "Help & FAQ", url: "/help", icon: HelpCircle },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Main: true,
    Trading: false,
    Finance: false,
    "Green Impact": false,
    "Analytics & AI": false,
    Account: false,
    Administration: false,
  });
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-border relative",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 glossy shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-lg text-foreground tracking-tight">GreenGrid</span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn(
        "flex-1 py-3 overflow-y-auto scrollbar-thin",
        collapsed ? "px-2" : "px-3"
      )}>
        {navSections.map((section) => {
          const sectionActive = section.items.some(item => location.pathname === item.url);
          
          return (
            <div key={section.label} className={collapsed ? "mb-1" : "mb-1"}>
              {/* Section Header - Always visible */}
              <button
                onClick={() => {
                  if (collapsed) {
                    setCollapsed(false);
                    setExpandedSections(prev => ({ ...prev, [section.label]: true }));
                  } else {
                    toggleSection(section.label);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg text-[12px] font-semibold transition-all duration-200",
                  collapsed 
                    ? "justify-center w-11 h-11 mx-auto" 
                    : "px-3 py-2.5",
                  expandedSections[section.label] || sectionActive
                    ? "text-foreground bg-muted/50" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                title={collapsed ? section.label : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center flex-shrink-0 rounded-lg transition-colors",
                  collapsed ? "w-full h-full" : "w-5 h-5",
                  sectionActive ? "text-primary" : expandedSections[section.label] ? "text-primary" : ""
                )}>
                  <section.icon className="w-[18px] h-[18px]" />
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        expandedSections[section.label] ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </>
                )}
              </button>

              {/* Section Items - Only when expanded and NOT collapsed */}
              {!collapsed && (
                <AnimatePresence initial={false}>
                  {expandedSections[section.label] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 pl-3 border-l-2 border-border/50">
                        {section.items.map((item) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <Link
                              key={item.title}
                              to={item.url}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative",
                                isActive
                                  ? "bg-primary/10 text-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              )}
                            >
                              <item.icon
                                className={cn(
                                  "w-[16px] h-[16px] flex-shrink-0 transition-colors",
                                  isActive ? "text-primary" : "group-hover:text-primary"
                                )}
                              />
                              <span>{item.title}</span>
                              {isActive && (
                                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-2 w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* User */}
      <div className={cn(
        "px-4 py-3 border-t border-border",
        collapsed && "justify-center px-2"
      )}>
        <SignedIn>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || "User"} 
                className="w-9 h-9 rounded-full flex-shrink-0 ring-2 ring-primary/20 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 ring-2 ring-primary/20 flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">
                  {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.emailAddresses?.[0]?.emailAddress || "Producer"}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="mt-2 w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </SignedIn>
        <SignedOut>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            {collapsed ? (
              <SignInButton mode="modal">
                <button className="w-10 h-10 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors">
                  <User className="w-5 h-5" />
                </button>
              </SignInButton>
            ) : (
              <SignInButton mode="modal">
                <Button variant="default" size="sm" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>
        </SignedOut>
      </div>
    </motion.aside>
  );
}

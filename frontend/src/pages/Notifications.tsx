import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, FileText, CreditCard, Award, Gavel, Plug, Zap, Settings, Check, Trash2, Filter } from "lucide-react";
import { useState } from "react";

const notifications = [
  { id: 1, type: "contract", title: "New Contract Created", message: "Energy purchase contract CON-2026-055 has been created with SolarFarm Alpha.", time: "2 min ago", read: false, icon: FileText },
  { id: 2, type: "payment", title: "Payment Received", message: "₹4,250 has been credited to your account from HydroFlow Kerala.", time: "15 min ago", read: false, icon: CreditCard },
  { id: 3, type: "certificate", title: "Certificate Issued", message: "REC certificate REC-2026-003 for 800 kWh has been issued.", time: "1 hour ago", read: false, icon: Award },
  { id: 4, type: "meter", title: "Smart Meter Alert", message: "Device SM-003 disconnected. Last sync was 2 hours ago.", time: "2 hours ago", read: true, icon: Plug },
  { id: 5, type: "auction", title: "Auction Won", message: "You won auction AUC-001 for 500 kWh at ₹5.60/kWh.", time: "3 hours ago", read: true, icon: Gavel },
  { id: 6, type: "contract", title: "Contract Completed", message: "Energy delivery for CON-2026-042 has been completed successfully.", time: "5 hours ago", read: true, icon: CheckCircle },
  { id: 7, type: "payment", title: "Invoice Due", message: "Invoice INV-2026-003 for ₹3,820 is due in 3 days.", time: "1 day ago", read: true, icon: CreditCard },
  { id: 8, type: "meter", title: "Meter Reading Updated", message: "SM-001 synced successfully. 124.5 kWh recorded.", time: "1 day ago", read: true, icon: Zap },
  { id: 9, type: "certificate", title: "Certificate Expiring", message: "Certificate REC-2025-032 will expire in 30 days.", time: "2 days ago", read: true, icon: Award },
  { id: 10, type: "system", title: "System Maintenance", message: "Scheduled maintenance on March 5, 2026 from 2-4 AM IST.", time: "3 days ago", read: true, icon: Settings },
];

const typeColors: Record<string, string> = {
  contract: "bg-primary/10 text-primary",
  payment: "bg-saffron/10 text-saffron",
  certificate: "bg-accent/10 text-accent",
  meter: "bg-primary/10 text-primary",
  auction: "bg-saffron/10 text-saffron",
  system: "bg-muted text-muted-foreground",
};

const filters = ["All", "Contracts", "Payments", "Certificates", "Meters", "Auctions"];

const Notifications = () => {
  const [notificationList, setNotificationList] = useState(notifications);
  const [activeFilter, setActiveFilter] = useState("All");

  const unreadCount = notificationList.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotificationList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotificationList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: number) => {
    setNotificationList(prev => prev.filter(n => n.id !== id));
  };

  const filtered = activeFilter === "All" 
    ? notificationList 
    : notificationList.filter(n => {
        if (activeFilter === "Contracts") return n.type === "contract";
        if (activeFilter === "Payments") return n.type === "payment";
        if (activeFilter === "Certificates") return n.type === "certificate";
        if (activeFilter === "Meters") return n.type === "meter";
        if (activeFilter === "Auctions") return n.type === "auction";
        return true;
      });

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative">
          <FloatingOrbs />
          <div className="max-w-[900px] mx-auto space-y-8 relative z-10">

            {/* Hero Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-8 lg:p-10"
            >
              <div className="absolute inset-0 animate-energy-flow" style={{
                backgroundSize: "200% 200%",
                background: "linear-gradient(135deg, hsl(217 91% 50% / 0.9), hsl(142 72% 35% / 0.75), hsl(30 100% 55% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Bell className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Notification Center</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Notifications
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Stay updated with contract changes, payments, certificates, and system alerts.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={unreadCount} />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Unread</p>
                  </div>
                  <Button 
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <Check className="w-4 h-4 mr-2" /> Mark All Read
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl p-4 flex flex-wrap items-center gap-4 border border-border"
            >
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1.5 flex-wrap">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      activeFilter === f
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                {filtered.length} notifications
              </div>
            </motion.div>

            {/* Notifications List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <div className="p-10 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  filtered.map((notification, i) => {
                    const Icon = notification.icon;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.03 }}
                        className={`flex items-start gap-4 p-5 transition-colors hover:bg-muted/30 ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[notification.type]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-foreground">{notification.title}</h4>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">{notification.time}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Load More */}
            {filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <Button variant="outline" className="text-xs">
                  Load More Notifications
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Notifications;

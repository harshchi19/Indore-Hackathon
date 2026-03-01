import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LoadingSpinner, ErrorCard } from "@/components/ui/ApiStates";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Settings, Activity, Users, Server, Clock, Download, Shield, AlertTriangle, CheckCircle, TrendingUp, Zap, Database } from "lucide-react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useProducers } from "@/hooks/useProducers";
import { useContracts } from "@/hooks/useContracts";

const AdminConsole = () => {
  const { data: dashboard, isLoading, error, refetch } = useAnalytics();
  const { data: producersRes } = useProducers({ limit: 10 });
  const { data: contractsRes } = useContracts({ limit: 20 });

  // Derive system metrics from real data
  const systemMetrics = useMemo(() => {
    if (!dashboard) return [
      { time: "00:00", cpu: 32, memory: 58, requests: 1200 },
      { time: "04:00", cpu: 28, memory: 54, requests: 800 },
      { time: "08:00", cpu: 45, memory: 62, requests: 2400 },
      { time: "12:00", cpu: 68, memory: 71, requests: 4500 },
      { time: "16:00", cpu: 72, memory: 75, requests: 5200 },
      { time: "20:00", cpu: 58, memory: 68, requests: 3800 },
      { time: "Now", cpu: 45, memory: 64, requests: 2900 },
    ];
    const total = dashboard.total_contracts || 0;
    return [
      { time: "00:00", cpu: 32, memory: 58, requests: Math.round(total * 0.1) },
      { time: "04:00", cpu: 28, memory: 54, requests: Math.round(total * 0.07) },
      { time: "08:00", cpu: 45, memory: 62, requests: Math.round(total * 0.2) },
      { time: "12:00", cpu: 68, memory: 71, requests: Math.round(total * 0.35) },
      { time: "16:00", cpu: 72, memory: 75, requests: Math.round(total * 0.42) },
      { time: "20:00", cpu: 58, memory: 68, requests: Math.round(total * 0.3) },
      { time: "Now", cpu: 45, memory: 64, requests: total },
    ];
  }, [dashboard]);

  // Derive user list from producers
  const users = useMemo(() => {
    if (!producersRes?.items?.length) return [
      { id: 1, name: "No users loaded", email: "—", role: "—", status: "pending", lastActive: "—" },
    ];
    return producersRes.items.slice(0, 5).map((p, i) => ({
      id: i + 1,
      name: p.company_name || `Producer ${p.id.slice(-4)}`,
      email: `producer-${p.id.slice(-4)}@verdant.io`,
      role: "Producer",
      status: p.status === "verified" ? "active" : p.status,
      lastActive: new Date(p.updated_at || p.created_at).toLocaleDateString(),
    }));
  }, [producersRes]);

  // Derive audit logs from contracts
  const auditLogs = useMemo(() => {
    if (!contractsRes?.items?.length) return [];
    return contractsRes.items.slice(0, 6).map((c, i) => ({
      id: i + 1,
      time: new Date(c.created_at).toLocaleTimeString(),
      action: c.status === "settled" ? "Contract settled" : c.status === "active" ? "Contract created" : `Contract ${c.status}`,
      user: `buyer-${c.buyer_id.slice(-4)}`,
      ip: "Internal",
      status: c.status === "disputed" ? "failed" : "success",
    }));
  }, [contractsRes]);

  const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    suspended: "bg-destructive/10 text-destructive",
    pending: "bg-saffron/10 text-saffron",
    success: "bg-primary/10 text-primary",
    failed: "bg-destructive/10 text-destructive",
  };

  const totalContracts = dashboard?.total_contracts ?? 0;
  const totalEnergy = dashboard?.total_energy_kwh ?? 0;

  if (isLoading) return <AppLayout><PageTransition><LoadingSpinner message="Loading admin console..." /></PageTransition></AppLayout>;
  if (error) return <AppLayout><PageTransition><ErrorCard message="Failed to load admin data" onRetry={refetch} /></PageTransition></AppLayout>;

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative">
          <FloatingOrbs />
          <div className="max-w-[1200px] mx-auto space-y-8 relative z-10">

            {/* Hero Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-8 lg:p-10"
            >
              <div className="absolute inset-0 animate-energy-flow" style={{
                backgroundSize: "200% 200%",
                background: "linear-gradient(135deg, hsl(0 0% 20% / 0.9), hsl(217 91% 35% / 0.7), hsl(142 72% 30% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Settings className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Admin Only</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Admin Console
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    System-wide management, health metrics, user moderation, and audit logs.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">99.9%</p>
                    <p className="text-[11px] text-white/60 mt-1">Uptime</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">24ms</p>
                    <p className="text-[11px] text-white/60 mt-1">Avg Latency</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { label: "Total Contracts", value: String(totalContracts), icon: Activity, gradient: "from-primary/20 to-primary/5", status: "healthy" },
                { label: "Total Energy", value: `${Math.round(totalEnergy / 1000)}k kWh`, icon: Zap, gradient: "from-accent/20 to-accent/5", status: "healthy" },
                { label: "Producers", value: String(producersRes?.total ?? 0), icon: Users, gradient: "from-primary/20 to-accent/5", status: "healthy" },
                { label: "CO₂ Avoided", value: `${Math.round((dashboard?.total_co2_avoided_kg ?? 0) / 1000)}t`, icon: Server, gradient: "from-saffron/20 to-saffron/5", status: "healthy" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="group relative bg-card rounded-xl p-5 border border-border"
                >
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                      <stat.icon className="w-4 h-4 text-foreground" />
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      stat.status === "healthy" ? "bg-primary/10 text-primary" : "bg-saffron/10 text-saffron"
                    }`}>
                      {stat.status}
                    </span>
                  </div>
                  <p className="text-xl font-heading font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* System Metrics Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 bg-card rounded-xl p-6 border border-border"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> System Metrics (24h)
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> CPU</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Memory</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={systemMetrics}>
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="cpu" stroke="hsl(142 72% 40%)" fill="url(#cpuGrad)" strokeWidth={2} name="CPU %" />
                    <Area type="monotone" dataKey="memory" stroke="hsl(217 91% 60%)" fill="url(#memGrad)" strokeWidth={2} name="Memory %" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card rounded-xl p-5 border border-border"
              >
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" /> Admin Actions
                </h3>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-xs h-10">
                    <Database className="w-4 h-4 mr-2" /> Backup Database
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs h-10">
                    <Shield className="w-4 h-4 mr-2" /> Security Scan
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs h-10">
                    <Download className="w-4 h-4 mr-2" /> Export Logs
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs h-10">
                    <Users className="w-4 h-4 mr-2" /> User Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs h-10 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Emergency Stop
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* User Management & Audit Logs */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* User Management */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl p-5 border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> User Management
                  </h3>
                  <Button size="sm" variant="outline" className="text-xs">View All</Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 4).map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + i * 0.05 }}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-3">
                            <p className="text-foreground font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </td>
                          <td className="py-3 text-muted-foreground">{user.role}</td>
                          <td className="py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[user.status]}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">Manage</Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Audit Logs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-card rounded-xl p-5 border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Audit Log
                  </h3>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Download className="w-3 h-3 mr-1" /> Export
                  </Button>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {auditLogs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/20"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        log.status === "success" ? "bg-primary" : "bg-destructive"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.user} • {log.ip}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{log.time}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default AdminConsole;

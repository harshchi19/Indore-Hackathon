import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LoadingSpinner, ErrorCard } from "@/components/ui/ApiStates";
import { motion } from "framer-motion";
import { Zap, Leaf, ShoppingCart, TrendingUp, Brain, ArrowUpRight, ArrowDownRight, Sun, Wind, Battery, Droplets, Sparkles, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useListings } from "@/hooks/useListings";
import { useMemo } from "react";

const sourceIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  solar: Sun,
  wind: Wind,
  hydro: Droplets,
  biomass: Battery,
  geothermal: Battery,
};

const sourceColorMap: Record<string, string> = {
  solar: "bg-saffron",
  wind: "bg-accent",
  hydro: "bg-primary",
  biomass: "bg-muted-foreground",
  geothermal: "bg-muted-foreground",
};

/* Fallback chart data when no monthly trend available */
const fallbackEnergyData = [
  { time: "6AM", supply: 200, demand: 180 },
  { time: "8AM", supply: 320, demand: 400 },
  { time: "10AM", supply: 500, demand: 380 },
  { time: "12PM", supply: 650, demand: 420 },
  { time: "2PM", supply: 580, demand: 460 },
  { time: "4PM", supply: 400, demand: 520 },
  { time: "6PM", supply: 280, demand: 600 },
  { time: "8PM", supply: 180, demand: 480 },
  { time: "10PM", supply: 120, demand: 280 },
];

const fallbackCityData = [
  { city: "Delhi", usage: 2400 },
  { city: "Mumbai", usage: 1800 },
  { city: "Bangalore", usage: 1600 },
  { city: "Chennai", usage: 1200 },
  { city: "Pune", usage: 900 },
];

const Dashboard = () => {
  const { data: dashboard, isLoading, error, refetch } = useAnalytics();

  const { data: listings } = useListings({ limit: 100 });

  const activeListingsCount = listings?.items?.filter(l => l.status === "active").length ?? 0;

  const stats = useMemo(() => [
    { label: "Energy Traded", value: dashboard ? (dashboard.total_energy_kwh ?? 0).toLocaleString() : "---", unit: "kWh", change: "+12.4%", up: true, icon: Zap, gradient: "from-primary/20 to-primary/5" },
    { label: "Carbon Saved", value: dashboard ? (dashboard.total_co2_avoided_kg ?? 0).toLocaleString() : "---", unit: "kg", change: "+8.2%", up: true, icon: Leaf, gradient: "from-primary/20 to-primary/5" },
    { label: "Active Listings", value: activeListingsCount.toString(), unit: "", change: "+5.1%", up: true, icon: ShoppingCart, gradient: "from-accent/20 to-accent/5" },
    { label: "Avg Price", value: "₹6.40", unit: "/kWh", change: "-2.1%", up: false, icon: TrendingUp, gradient: "from-saffron/20 to-saffron/5" },
  ], [dashboard, activeListingsCount]);

  const energySources = useMemo(() => {
    if (!dashboard?.energy_by_source) return [];
    const entries = Object.entries(dashboard.energy_by_source);
    const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;
    return entries.map(([src, kwh]) => ({
      type: src.charAt(0).toUpperCase() + src.slice(1),
      icon: sourceIconMap[src] || Battery,
      amount: `${kwh.toLocaleString()} kWh`,
      pct: Math.round((kwh / total) * 100),
      color: sourceColorMap[src] || "bg-muted-foreground",
    }));
  }, [dashboard]);

  const chartData = useMemo(() => {
    if (!dashboard?.monthly_trend?.length) return fallbackEnergyData;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return dashboard.monthly_trend.map((m) => ({
      time: months[m.month - 1] || `M${m.month}`,
      supply: m.total_kwh,
      demand: Math.round(m.total_kwh * 0.85),
    }));
  }, [dashboard]);

  if (isLoading) {
    return (
      <AppLayout>
        <PageTransition>
          <LoadingSpinner message="Loading dashboard..." />
        </PageTransition>
      </AppLayout>
    );
  }

  if (error && !dashboard) {
    return (
      <AppLayout>
        <PageTransition>
          <ErrorCard message="Failed to load dashboard data" onRetry={() => refetch()} />
        </PageTransition>
      </AppLayout>
    );
  }
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
              {/* Rich animated gradient background */}
              <div className="absolute inset-0 animate-energy-flow" style={{
                backgroundSize: "200% 200%",
                background: "linear-gradient(135deg, hsl(142 72% 29% / 0.85), hsl(217 91% 50% / 0.7), hsl(142 72% 35% / 0.6), hsl(30 100% 55% / 0.4))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-white font-medium">Live Intelligence Active</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Welcome to GreenGrid Energy Intelligence
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Real-time AI-powered insights for clean energy trading and carbon optimization across your network.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={dashboard?.total_energy_kwh ?? 0} suffix="" />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">kWh Flowing Now</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={dashboard?.total_co2_avoided_kg ?? 0} suffix="" />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">kg CO₂ Saved Today</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Live Energy Strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-6 px-6 py-3.5 rounded-xl bg-card border border-border overflow-hidden"
            >
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-muted-foreground text-xs font-medium">LIVE</span>
              </div>
              <div className="flex items-center gap-8 text-sm overflow-x-auto">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground text-xs">Energy Traded:</span>
                  <span className="font-heading font-bold text-foreground"><AnimatedCounter end={dashboard?.total_energy_kwh ?? 0} suffix=" kWh" /></span>
                </span>
                <span className="w-px h-4 bg-border flex-shrink-0" />
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Leaf className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground text-xs">Carbon Saved:</span>
                  <span className="font-heading font-bold text-foreground"><AnimatedCounter end={dashboard?.total_co2_avoided_kg ?? 0} suffix=" kg" /></span>
                </span>
                <span className="w-px h-4 bg-border flex-shrink-0" />
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Sun className="w-3.5 h-3.5 text-saffron" />
                  <span className="text-muted-foreground text-xs">Active Producers:</span>
                  <span className="font-heading font-bold text-foreground"><AnimatedCounter end={dashboard?.total_contracts ?? 0} suffix="+" /></span>
                </span>
              </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="group relative bg-card rounded-xl p-6 border border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                >
                  {/* Gradient top border */}
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${stat.up ? "text-primary" : "text-destructive"}`}>
                      {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{stat.value}<span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Energy Flow Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2 bg-card rounded-xl p-6 border border-border"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Energy Flow</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Supply vs Demand today</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Supply</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Demand</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "hsl(var(--foreground))",
                        boxShadow: "0 8px 32px hsl(var(--foreground) / 0.08)",
                      }}
                    />
                    <Area type="monotone" dataKey="supply" stroke="hsl(142 72% 40%)" fill="url(#supplyGrad)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="demand" stroke="hsl(217 91% 60%)" fill="url(#demandGrad)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* AI Insight Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative overflow-hidden bg-card rounded-xl p-6 border border-border flex flex-col"
              >
                {/* Subtle gradient shimmer */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06] blur-[60px] rounded-full" style={{ background: "hsl(142 72% 40%)" }} />

                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glossy">
                    <Brain className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm">AI Insights</h3>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary font-medium">Live Analysis</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                    <p className="text-[10px] text-primary mb-1.5 uppercase tracking-wider font-semibold">💡 Recommendation</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      Switch to nearby solar producer — save <span className="text-primary font-bold">18%</span> on energy costs.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">Confidence:</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "94%" }}
                          transition={{ delay: 1, duration: 1 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-primary">94%</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/30 p-4">
                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-semibold">⏰ Peak Prediction</p>
                    <p className="text-sm text-foreground">
                      Expected peak at <span className="text-saffron font-bold">7:00 PM</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Demand surges 40% above baseline</p>
                  </div>

                  <div className="rounded-xl bg-muted/30 p-4">
                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-semibold">🌱 Sustainability Score</p>
                    <div className="flex items-end gap-3 mt-1">
                      <span className="text-3xl font-heading font-bold text-primary">92</span>
                      <span className="text-sm text-muted-foreground mb-1">/100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted mt-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "92%" }}
                        transition={{ delay: 1.2, duration: 1.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Energy Sources */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <h3 className="font-heading font-semibold text-foreground mb-5">Energy Sources</h3>
                <div className="space-y-4">
                  {energySources.map((src, i) => (
                    <motion.div
                      key={src.type}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <src.icon className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-foreground">{src.type}</span>
                          <span className="text-xs text-muted-foreground">{src.amount}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${src.pct}%` }}
                            transition={{ delay: 1 + i * 0.15, duration: 0.8 }}
                            className={`h-full rounded-full ${src.color}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* City Usage */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <h3 className="font-heading font-semibold text-foreground mb-5">City Energy Usage</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={fallbackCityData}>
                    <defs>
                      <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142 72% 40%)" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(142 72% 40%)" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="city" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "hsl(var(--foreground))",
                        boxShadow: "0 8px 32px hsl(var(--foreground) / 0.08)",
                      }}
                    />
                    <Bar dataKey="usage" fill="url(#cityGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Dashboard;

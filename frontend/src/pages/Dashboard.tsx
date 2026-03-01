import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LoadingSpinner, ErrorCard } from "@/components/ui/ApiStates";
import { motion } from "framer-motion";
import { Zap, Leaf, ShoppingCart, TrendingUp, Brain, ArrowUpRight, ArrowDownRight, Sun, Wind, Battery, Droplets, Sparkles, Activity, Network, Crown, Users, GitBranch, CircleDot } from "lucide-react";
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
  { city: "Indore", usage: 900 },
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

            {/* ═══ Neo4j Graph Intelligence Section ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
            >
              <div className="absolute inset-0" style={{
                background: "linear-gradient(135deg, hsl(142 72% 12% / 0.95), hsl(220 50% 10% / 0.95), hsl(142 60% 8% / 0.9))"
              }} />
              <div className="absolute inset-0 grain opacity-20" />

              {/* Animated network lines background */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(142 72% 50%)" stopOpacity="0" />
                    <stop offset="50%" stopColor="hsl(142 72% 50%)" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(142 72% 50%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[
                  "M0,60 Q200,20 400,80 T800,40", "M0,120 Q250,180 500,100 T1000,160",
                  "M0,200 Q300,140 600,220 T1200,180", "M100,0 Q150,100 200,200 T300,400",
                  "M400,0 Q350,150 500,250 T600,400", "M700,0 Q750,80 680,200 T800,400",
                ].map((d, i) => (
                  <motion.path
                    key={i} d={d} fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.15, duration: 2, ease: "easeInOut" }}
                  />
                ))}
                {[
                  { cx: 200, cy: 60 }, { cx: 500, cy: 100 }, { cx: 350, cy: 180 },
                  { cx: 700, cy: 40 }, { cx: 150, cy: 200 }, { cx: 600, cy: 220 },
                  { cx: 400, cy: 80 }, { cx: 250, cy: 140 }, { cx: 680, cy: 160 },
                ].map((p, i) => (
                  <motion.circle
                    key={`n${i}`} cx={p.cx} cy={p.cy} r="3" fill="hsl(142 72% 50%)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0.4] }}
                    transition={{ delay: 1.2 + i * 0.1, duration: 1.5, repeat: Infinity, repeatDelay: 3 + i * 0.5 }}
                  />
                ))}
              </svg>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Network className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-lg">Graph Intelligence</h3>
                    <p className="text-xs text-white/50">Neo4j-powered network analytics &amp; relationships</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <CircleDot className="w-3 h-3 text-primary animate-pulse" />
                    <span className="text-[10px] text-primary font-medium">Graph Active</span>
                  </div>
                </div>

                {/* Graph Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: "Nodes", value: 1248, icon: Users, color: "text-primary" },
                    { label: "Producers", value: 86, icon: Crown, color: "text-saffron" },
                    { label: "Listings", value: 342, icon: ShoppingCart, color: "text-accent" },
                    { label: "Contracts", value: 567, icon: GitBranch, color: "text-emerald-400" },
                    { label: "Edges", value: 3891, icon: Network, color: "text-blue-400" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.06 }}
                      className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300 hover:border-primary/20"
                    >
                      <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
                      <p className="text-xl font-heading font-bold text-white">
                        <AnimatedCounter end={s.value} />
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Graph Analytics Grid — 3 columns */}
                <div className="grid lg:grid-cols-3 gap-4">

                  {/* Interactive Network Visualization */}
                  <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06] relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                      <Network className="w-4 h-4 text-primary" />
                      <h4 className="font-heading font-semibold text-white text-sm">Live Network</h4>
                    </div>
                    {/* SVG Network Graph */}
                    <div className="relative h-[200px]">
                      <svg className="w-full h-full" viewBox="0 0 300 200">
                        {/* Edges with animated gradients */}
                        {[
                          { x1: 150, y1: 100, x2: 60, y2: 40 }, { x1: 150, y1: 100, x2: 240, y2: 35 },
                          { x1: 150, y1: 100, x2: 45, y2: 160 }, { x1: 150, y1: 100, x2: 255, y2: 165 },
                          { x1: 150, y1: 100, x2: 90, y2: 100 }, { x1: 150, y1: 100, x2: 210, y2: 100 },
                          { x1: 60, y1: 40, x2: 90, y2: 100 }, { x1: 240, y1: 35, x2: 210, y2: 100 },
                          { x1: 45, y1: 160, x2: 90, y2: 100 }, { x1: 255, y1: 165, x2: 210, y2: 100 },
                          { x1: 60, y1: 40, x2: 150, y2: 20 }, { x1: 240, y1: 35, x2: 150, y2: 20 },
                        ].map((e, i) => (
                          <motion.line
                            key={`e${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                            stroke="hsl(142 72% 40%)" strokeWidth="1" strokeOpacity="0.25"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.9 + i * 0.05, duration: 0.8 }}
                          />
                        ))}
                        {/* Animated data pulses along edges */}
                        {[
                          { x1: 150, y1: 100, x2: 60, y2: 40 }, { x1: 150, y1: 100, x2: 240, y2: 35 },
                          { x1: 150, y1: 100, x2: 45, y2: 160 }, { x1: 150, y1: 100, x2: 255, y2: 165 },
                        ].map((e, i) => (
                          <motion.circle
                            key={`pulse${i}`} r="2.5" fill="hsl(142 72% 55%)" opacity="0.8"
                            initial={{ cx: e.x1, cy: e.y1 }}
                            animate={{ cx: [e.x1, e.x2, e.x1], cy: [e.y1, e.y2, e.y1] }}
                            transition={{ delay: 1.5 + i * 0.4, duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          />
                        ))}
                        {/* Nodes */}
                        {[
                          { cx: 150, cy: 100, r: 14, fill: "hsl(142 72% 35%)", label: "Hub", type: "hub" },
                          { cx: 150, cy: 20, r: 8, fill: "hsl(142 50% 45%)", label: "Grid", type: "grid" },
                          { cx: 60, cy: 40, r: 10, fill: "hsl(30 100% 55%)", label: "Solar", type: "producer" },
                          { cx: 240, cy: 35, r: 10, fill: "hsl(217 91% 55%)", label: "Wind", type: "producer" },
                          { cx: 45, cy: 160, r: 9, fill: "hsl(190 80% 50%)", label: "Hydro", type: "producer" },
                          { cx: 255, cy: 165, r: 9, fill: "hsl(142 72% 45%)", label: "Bio", type: "producer" },
                          { cx: 90, cy: 100, r: 7, fill: "hsl(260 60% 55%)", label: "C1", type: "consumer" },
                          { cx: 210, cy: 100, r: 7, fill: "hsl(260 60% 55%)", label: "C2", type: "consumer" },
                        ].map((n, i) => (
                          <g key={`node${i}`}>
                            <motion.circle
                              cx={n.cx} cy={n.cy} r={n.r + 6} fill={n.fill}
                              animate={{ opacity: [0.04, 0.22, 0.04] }}
                              transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                            />
                            <motion.circle
                              cx={n.cx} cy={n.cy} r={n.r} fill={n.fill}
                              stroke="rgba(255,255,255,0.3)" strokeWidth="1"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 1 + i * 0.08, type: "spring" }}
                            />
                            <text x={n.cx} y={n.cy + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="600">{n.label}</text>
                          </g>
                        ))}
                      </svg>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-2">
                      {[
                        { color: "bg-saffron", label: "Producers" },
                        { color: "bg-[hsl(260,60%,55%)]", label: "Consumers" },
                        { color: "bg-primary", label: "Hub" },
                      ].map(l => (
                        <span key={l.label} className="flex items-center gap-1.5 text-[9px] text-white/40">
                          <span className={`w-2 h-2 rounded-full ${l.color}`} />
                          {l.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Producer Rankings */}
                  <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="w-4 h-4 text-saffron" />
                      <h4 className="font-heading font-semibold text-white text-sm">Top Producers</h4>
                      <span className="ml-auto text-[10px] text-white/40">by volume</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "SolarGrid India", source: "solar", kwh: 12400, contracts: 34, score: 96 },
                        { name: "WindForce Energy", source: "wind", kwh: 9800, contracts: 28, score: 91 },
                        { name: "HydroFlow Power", source: "hydro", kwh: 7200, contracts: 22, score: 87 },
                        { name: "BioGreen Corp", source: "biomass", kwh: 4600, contracts: 15, score: 78 },
                        { name: "GeoPower Ltd", source: "geothermal", kwh: 3100, contracts: 11, score: 72 },
                      ].map((p, i) => {
                        const SourceIcon = sourceIconMap[p.source] || Battery;
                        return (
                          <motion.div
                            key={p.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + i * 0.08 }}
                            className="flex items-center gap-3 group"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              i === 0 ? "bg-saffron/20 text-saffron" :
                              i === 1 ? "bg-gray-300/20 text-gray-300" :
                              i === 2 ? "bg-amber-600/20 text-amber-500" :
                              "bg-white/10 text-white/50"
                            }`}>
                              {i + 1}
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                              <SourceIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{p.name}</p>
                              <p className="text-[10px] text-white/40">{p.kwh.toLocaleString()} kWh · {p.contracts} contracts</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-primary">{p.score}</div>
                              <div className="text-[9px] text-white/30">score</div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Energy Network Flow + Relationship Chart */}
                  <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-4">
                      <GitBranch className="w-4 h-4 text-accent" />
                      <h4 className="font-heading font-semibold text-white text-sm">Trade Flows</h4>
                    </div>

                    {/* Network Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { label: "Total kWh", value: 24800, color: "text-primary" },
                        { label: "Trade Routes", value: 47, color: "text-accent" },
                        { label: "Transactions", value: 156, color: "text-saffron" },
                        { label: "Avg Size", value: 159, color: "text-emerald-400" },
                      ].map((s, i) => (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.85 + i * 0.05 }}
                          className="bg-white/[0.03] rounded-lg p-2.5"
                        >
                          <p className={`text-base font-heading font-bold ${s.color}`}>
                            <AnimatedCounter end={s.value} />
                          </p>
                          <p className="text-[9px] text-white/40">{s.label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Source Distribution */}
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">Source Distribution</p>
                    <div className="space-y-2">
                      {[
                        { source: "Solar", kwh: 12400, color: "from-saffron to-saffron/70" },
                        { source: "Wind", kwh: 8200, color: "from-accent to-accent/70" },
                        { source: "Hydro", kwh: 5600, color: "from-primary to-primary/70" },
                        { source: "Biomass", kwh: 2100, color: "from-emerald-600 to-emerald-500" },
                      ].map((s, i) => {
                        const pct = Math.round((s.kwh / 12400) * 100);
                        return (
                          <motion.div key={s.source} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + i * 0.05 }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-white/70">{s.source}</span>
                              <span className="text-[10px] text-white/40">{s.kwh.toLocaleString()} kWh</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 1 + i * 0.1, duration: 0.8 }}
                                className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

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

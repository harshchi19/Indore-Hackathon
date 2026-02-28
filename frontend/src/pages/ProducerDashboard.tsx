import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Brain, ArrowUpRight, Clock, IndianRupee, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const demandVsSupply = [
  { hour: "6AM", demand: 120, supply: 180 },
  { hour: "8AM", demand: 280, supply: 200 },
  { hour: "10AM", demand: 350, supply: 420 },
  { hour: "12PM", demand: 300, supply: 500 },
  { hour: "2PM", demand: 320, supply: 460 },
  { hour: "4PM", demand: 400, supply: 380 },
  { hour: "6PM", demand: 520, supply: 280 },
  { hour: "8PM", demand: 440, supply: 180 },
];

const sellingHours = [
  { hour: "6AM", revenue: 120 },
  { hour: "8AM", revenue: 280 },
  { hour: "10AM", revenue: 520 },
  { hour: "12PM", revenue: 680 },
  { hour: "2PM", revenue: 590 },
  { hour: "4PM", revenue: 420 },
  { hour: "6PM", revenue: 350 },
  { hour: "8PM", revenue: 180 },
];

const producerStats = [
  { label: "Energy Listed", value: "1,240", unit: "kWh", change: "+8.3%", icon: Zap, gradient: "from-primary/20 to-primary/5" },
  { label: "Revenue Today", value: "₹7,820", unit: "", change: "+14.2%", icon: IndianRupee, gradient: "from-saffron/20 to-saffron/5" },
  { label: "Demand Trend", value: "↑ Rising", unit: "", change: "+22%", icon: TrendingUp, gradient: "from-accent/20 to-accent/5" },
  { label: "AI Price Tip", value: "₹6.80", unit: "/kWh", change: "Optimal", icon: Brain, gradient: "from-primary/20 to-accent/5" },
];

const ProducerDashboard = () => {
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
                background: "linear-gradient(135deg, hsl(30 100% 50% / 0.85), hsl(142 72% 35% / 0.7), hsl(30 90% 55% / 0.6), hsl(217 91% 55% / 0.45))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Producer Mode</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Your Energy Production Hub
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    AI-powered analytics to maximize your revenue and optimize pricing in real-time.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={7820} prefix="₹" />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Revenue Today</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {producerStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="group relative bg-card rounded-xl p-6 border border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                >
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{stat.value}<span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Demand vs Supply */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2 bg-card rounded-xl p-6 border border-border"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Demand vs Supply</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Your production vs market demand</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Your Supply</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-saffron" /> Demand</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={demandVsSupply}>
                    <defs>
                      <linearGradient id="pSupply" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="pDemand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(30 100% 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(30 100% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))", boxShadow: "0 8px 32px hsl(var(--foreground) / 0.08)" }} />
                    <Area type="monotone" dataKey="supply" stroke="hsl(142 72% 40%)" fill="url(#pSupply)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="demand" stroke="hsl(30 100% 60%)" fill="url(#pDemand)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* AI Suggestion */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative overflow-hidden bg-card rounded-xl p-6 border border-border flex flex-col"
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06] blur-[60px] rounded-full" style={{ background: "hsl(30 100% 60%)" }} />

                <div className="flex items-center gap-2 mb-6 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron to-primary flex items-center justify-center glossy">
                    <Brain className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm">AI Advisor</h3>
                    <span className="text-[10px] text-saffron font-medium flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Revenue Optimizer
                    </span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 relative z-10">
                  <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                    <p className="text-[10px] text-primary mb-2 uppercase tracking-wider font-semibold">💡 Price Optimization</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      Increase price by <span className="text-primary font-bold">₹1.00</span> between{" "}
                      <span className="text-saffron font-semibold">6–9 PM</span> to maximize revenue.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">Impact:</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted">
                        <motion.div initial={{ width: 0 }} animate={{ width: "87%" }} transition={{ delay: 1, duration: 1 }} className="h-full rounded-full bg-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-primary">+₹890</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/30 p-4">
                    <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">📊 Market Signal</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      Solar supply drops <span className="text-destructive font-semibold">30%</span> after 5 PM.
                      Your battery reserve can fill the gap.
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Best Selling Window</p>
                    </div>
                    <p className="text-lg font-heading font-bold text-accent">10 AM – 2 PM</p>
                    <p className="text-xs text-muted-foreground mt-1">68% of your daily revenue</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Revenue by Hour */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <h3 className="font-heading font-semibold text-foreground mb-5">Revenue by Hour</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sellingHours}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(30 100% 60%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(30 100% 60%)" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))", boxShadow: "0 8px 32px hsl(var(--foreground) / 0.08)" }} />
                  <Bar dataKey="revenue" fill="url(#revGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default ProducerDashboard;

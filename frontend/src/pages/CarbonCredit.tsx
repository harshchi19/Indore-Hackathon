import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LoadingSpinner, ErrorCard } from "@/components/ui/ApiStates";
import { motion } from "framer-motion";
import { Leaf, Sparkles, TrendingUp, TrendingDown, ArrowUpRight, Medal, Crown, Award, Zap, ShoppingCart } from "lucide-react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useAnalytics, useProducerPerformance } from "@/hooks/useAnalytics";

const priceHistory = [
  { time: "9AM", price: 12.4 }, { time: "10AM", price: 12.8 }, { time: "11AM", price: 13.1 },
  { time: "12PM", price: 12.6 }, { time: "1PM", price: 13.4 }, { time: "2PM", price: 14.2 },
  { time: "3PM", price: 13.8 }, { time: "4PM", price: 14.5 }, { time: "5PM", price: 15.1 },
  { time: "6PM", price: 14.8 }, { time: "7PM", price: 15.6 }, { time: "Now", price: 15.2 },
];

const leaderboard = {
  consumers: [
    { name: "Priya M.", score: 2840, badge: "🌱" },
    { name: "Rahul K.", score: 2120, badge: "🌱" },
    { name: "Ananya S.", score: 1890, badge: "🌿" },
    { name: "Vikram P.", score: 1650, badge: "🌿" },
    { name: "Diya R.", score: 1420, badge: "☘️" },
  ],
  producers: [
    { name: "SolarFarm Alpha", score: 12400, badge: "⚡" },
    { name: "WindTech Pune", score: 9800, badge: "⚡" },
    { name: "HydroFlow Kerala", score: 8200, badge: "💧" },
    { name: "GreenWind TN", score: 6100, badge: "🌬️" },
    { name: "MicroSolar Goa", score: 4800, badge: "☀️" },
  ],
  investors: [
    { name: "CleanTech Fund", score: 84200, badge: "💰" },
    { name: "GreenVentures", score: 62000, badge: "💰" },
    { name: "Arjun S.", score: 28400, badge: "📈" },
    { name: "EcoCapital", score: 21000, badge: "📈" },
    { name: "SustainInvest", score: 15600, badge: "🌍" },
  ],
};

const rankIcons = [Crown, Medal, Award];

const CarbonCredit = () => {
  const [tradeAmount, setTradeAmount] = useState(10);
  const [activeTab, setActiveTab] = useState<"consumers" | "producers" | "investors">("consumers");

  const { data: dashboard, isLoading, error, refetch } = useAnalytics();

  const { data: performers } = useProducerPerformance(5);

  const totalCredits = useMemo(() => {
    if (!dashboard) return 0;
    return Math.round(dashboard.total_co2_avoided_kg / 10);
  }, [dashboard]);

  const creditPrice = useMemo(() => {
    if (!dashboard) return 15.2;
    return Math.round(dashboard.total_energy_kwh / Math.max(totalCredits, 1) * 100) / 100 || 15.2;
  }, [dashboard, totalCredits]);

  const currentPrice = creditPrice;

  const producerLeaderboard = useMemo(() => {
    if (!performers?.length) return leaderboard.producers;
    return performers.map((p) => ({
      name: p.company_name,
      score: Math.round(p.total_kwh),
      badge: "⚡",
    }));
  }, [performers]);

  if (isLoading) return <AppLayout><PageTransition><LoadingSpinner message="Loading carbon credit data..." /></PageTransition></AppLayout>;
  if (error) return <AppLayout><PageTransition><ErrorCard message={error.message} onRetry={refetch} /></PageTransition></AppLayout>;

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative">
          <FloatingOrbs />
          <div className="max-w-[1200px] mx-auto space-y-8 relative z-10">

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-8 lg:p-10">
              <div className="absolute inset-0 animate-energy-flow" style={{
                backgroundSize: "200% 200%",
                background: "linear-gradient(135deg, hsl(142 72% 30% / 0.85), hsl(30 100% 45% / 0.7), hsl(142 72% 40% / 0.6), hsl(217 91% 50% / 0.45))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Leaf className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Carbon Exchange</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Carbon Credit Trading Center
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Earn, trade, and track carbon credits. Gamified sustainability for maximum impact.
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-heading font-bold text-white">{totalCredits}</p>
                  <p className="text-[11px] text-white/60">Your Carbon Credits</p>
                </div>
              </div>
            </motion.div>

            {/* Credit Balance + Earning */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Credits Earned", value: String(Math.round(totalCredits * 0.75)), sub: "From renewables", icon: Zap, gradient: "from-primary/20 to-primary/5" },
                { label: "Credits Invested", value: String(Math.round(totalCredits * 0.25)), sub: "From investments", icon: TrendingUp, gradient: "from-saffron/20 to-saffron/5" },
                { label: "Market Price", value: `₹${currentPrice.toFixed(1)}`, sub: "Per credit", icon: ShoppingCart, gradient: "from-accent/20 to-accent/5" },
                { label: "Portfolio Value", value: `₹${(totalCredits * currentPrice).toLocaleString()}`, sub: `${totalCredits} × ₹${currentPrice.toFixed(1)}`, icon: Sparkles, gradient: "from-primary/20 to-accent/5" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="group relative bg-card rounded-xl p-6 border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Price Chart + Trading */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="lg:col-span-2 bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Credit Price — Live</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-heading font-bold text-foreground">₹{currentPrice}</span>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" /> +8.4% today
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-[11px] text-primary font-semibold">Bull Market</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[11, 16]} tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="price" stroke="hsl(142 72% 40%)" fill="url(#creditGrad)" strokeWidth={2.5} name="Price (₹)" />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Quick Trade */}
                <div className="mt-5 rounded-xl bg-muted/30 p-4 border border-border">
                  <p className="text-xs font-semibold text-foreground mb-3">Quick Trade</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Credits</span>
                        <span className="text-xs font-bold text-foreground">{tradeAmount}</span>
                      </div>
                      <input type="range" min={1} max={100} value={tradeAmount} onChange={e => setTradeAmount(+e.target.value)}
                        className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-heading font-bold text-foreground">₹{(tradeAmount * currentPrice).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total value</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="text-xs">Buy</Button>
                      <Button variant="outline" size="sm" className="text-xs">Sell</Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Leaderboard */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-4 h-4 text-saffron" />
                  <h3 className="font-heading font-semibold text-foreground text-sm">Sustainability Leaderboard</h3>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4">
                  {(["consumers", "producers", "investors"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-medium capitalize transition-all ${
                        activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}>{tab}</button>
                  ))}
                </div>

                <div className="space-y-2">
                  {(activeTab === "producers" ? producerLeaderboard : leaderboard[activeTab]).map((entry, i) => {
                    const RankIcon = i < 3 ? rankIcons[i] : null;
                    return (
                      <motion.div key={entry.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.06 }}
                        className={`flex items-center gap-3 rounded-xl p-3 ${i === 0 ? "bg-saffron/5 border border-saffron/15" : "bg-muted/20"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i === 0 ? "bg-saffron/20 text-saffron" : i === 1 ? "bg-muted text-muted-foreground" : i === 2 ? "bg-saffron/10 text-saffron" : "bg-muted/50 text-muted-foreground"
                        }`}>
                          {RankIcon ? <RankIcon className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{entry.badge} {entry.name}</p>
                        </div>
                        <span className="text-xs font-heading font-bold text-foreground">{entry.score.toLocaleString()}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default CarbonCredit;

// TODO: Backend integration pending — No /api/v1/investments endpoint exists yet.
// This page uses hardcoded investment projects and growth data.
// When an investments API is created, replace with service calls.
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, Sun, Wind, Zap, Leaf, IndianRupee, PieChart as PieIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

/* TODO: Replace with API data when backend investments endpoint is available */
const investments = [
  { id: 1, name: "Solar Farm — Rajasthan", type: "Solar", icon: Sun, funding: 500000, roi: 14.2, carbonImpact: 8400, credits: 120, risk: "Low" },
  { id: 2, name: "Wind Turbine — Tamil Nadu", type: "Wind", icon: Wind, funding: 750000, roi: 11.8, carbonImpact: 6200, credits: 90, risk: "Medium" },
  { id: 3, name: "Community Microgrid — Pune", type: "Grid", icon: Zap, funding: 300000, roi: 18.5, carbonImpact: 4800, credits: 70, risk: "Low" },
];

const growthData = [
  { month: "M1", value: 0 }, { month: "M3", value: 2800 }, { month: "M6", value: 7200 },
  { month: "M9", value: 12400 }, { month: "M12", value: 18600 }, { month: "M18", value: 32000 },
  { month: "M24", value: 48000 },
];

const InvestorZone = () => {
  const [investAmount, setInvestAmount] = useState(100000);
  const [selectedInvestment, setSelectedInvestment] = useState(0);

  const simulation = useMemo(() => {
    const inv = investments[selectedInvestment];
    const ratio = investAmount / inv.funding;
    return {
      monthlyReturn: Math.round(investAmount * (inv.roi / 100) / 12),
      payback: Math.round(12 / (inv.roi / 100)),
      carbonOffset: Math.round(inv.carbonImpact * ratio),
      credits: Math.round(inv.credits * ratio),
      yearlyReturn: Math.round(investAmount * (inv.roi / 100)),
    };
  }, [investAmount, selectedInvestment]);

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
                background: "linear-gradient(135deg, hsl(30 100% 50% / 0.8), hsl(142 72% 35% / 0.7), hsl(217 91% 50% / 0.65), hsl(30 90% 55% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                  <TrendingUp className="w-3 h-3 text-white" />
                  <span className="text-white font-medium">Investment Engine</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                  Green Energy Investment Simulator
                </h1>
                <p className="text-sm text-white/70 max-w-lg">
                  Simulate returns, carbon impact, and energy credits from renewable investments.
                </p>
              </div>
            </motion.div>

            {/* Investment Cards */}
            <div className="grid md:grid-cols-3 gap-5">
              {investments.map((inv, i) => (
                <motion.button key={inv.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  onClick={() => setSelectedInvestment(i)}
                  className={`text-left bg-card rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                    selectedInvestment === i ? "border-primary/40 ring-2 ring-primary/20 shadow-lg" : "border-border"
                  }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <inv.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-foreground">{inv.name}</h4>
                      <span className="text-[10px] text-muted-foreground">{inv.risk} Risk</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-muted/30 p-2">
                      <p className="text-xs text-muted-foreground">Funding</p>
                      <p className="font-heading font-bold text-foreground text-sm">₹{(inv.funding / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2">
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className="font-heading font-bold text-primary text-sm">{inv.roi}%</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2">
                      <p className="text-xs text-muted-foreground">CO₂ Impact</p>
                      <p className="font-heading font-bold text-foreground text-sm">{(inv.carbonImpact / 1000).toFixed(1)}T</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2">
                      <p className="text-xs text-muted-foreground">Credits</p>
                      <p className="font-heading font-bold text-saffron text-sm">{inv.credits}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Investment Input */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-1">Investment Simulator</h3>
                <p className="text-xs text-muted-foreground mb-6">Enter amount to simulate returns</p>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">Investment Amount</span>
                    <span className="text-sm font-bold text-primary">₹{investAmount.toLocaleString()}</span>
                  </div>
                  <input type="range" min={10000} max={1000000} step={10000} value={investAmount} onChange={e => setInvestAmount(+e.target.value)}
                    className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>₹10K</span><span>₹10L</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Monthly Return", value: `₹${simulation.monthlyReturn.toLocaleString()}`, color: "text-primary" },
                    { label: "Payback Period", value: `${simulation.payback} mo`, color: "text-accent" },
                    { label: "Carbon Offset", value: `${simulation.carbonOffset.toLocaleString()} kg`, color: "text-primary" },
                    { label: "Credits Earned", value: `${simulation.credits}`, color: "text-saffron" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-muted/30 p-3 text-center">
                      <motion.p key={s.value} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className={`text-lg font-heading font-bold ${s.color}`}>{s.value}</motion.p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Growth Graph + Portfolio */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-5">Projected Growth</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(142 72% 40%)" fill="url(#growthGrad)" strokeWidth={2.5} name="Returns (₹)" />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Mini portfolio */}
                <div className="mt-5 rounded-xl bg-primary/5 p-4 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Portfolio Summary</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-muted-foreground">Total Invested</p><p className="font-heading font-bold text-foreground">₹{investAmount.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Yearly Return</p><p className="font-heading font-bold text-primary">₹{simulation.yearlyReturn.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Carbon Credits</p><p className="font-heading font-bold text-saffron">{simulation.credits}</p></div>
                    <div><p className="text-xs text-muted-foreground">Sustainability</p><p className="font-heading font-bold text-accent">A+</p></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default InvestorZone;

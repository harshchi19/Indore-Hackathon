import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Leaf, Zap, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const FutureSimulator = () => {
  const [usage, setUsage] = useState(500);
  const [adoption, setAdoption] = useState(40);
  const [investment, setInvestment] = useState(50000);

  const projections = useMemo(() => {
    const base = { carbon: usage * 0.5 * (adoption / 100), money: usage * 6.5 * (adoption / 100) * 0.18, renewable: adoption, independence: Math.min(95, adoption * 1.2 + investment / 10000) };
    return [
      { year: "Now", carbon: 0, money: 0, renewable: adoption, independence: base.independence * 0.6 },
      { year: "Year 1", carbon: Math.round(base.carbon * 12), money: Math.round(base.money * 12), renewable: Math.min(95, adoption + 5), independence: Math.min(90, base.independence * 0.75) },
      { year: "Year 2", carbon: Math.round(base.carbon * 24 * 1.1), money: Math.round(base.money * 24 * 1.15), renewable: Math.min(95, adoption + 12), independence: Math.min(92, base.independence * 0.85) },
      { year: "Year 3", carbon: Math.round(base.carbon * 36 * 1.2), money: Math.round(base.money * 36 * 1.3), renewable: Math.min(95, adoption + 18), independence: Math.min(94, base.independence * 0.92) },
      { year: "Year 5", carbon: Math.round(base.carbon * 60 * 1.35), money: Math.round(base.money * 60 * 1.5), renewable: Math.min(98, adoption + 27), independence: Math.min(97, base.independence) },
    ];
  }, [usage, adoption, investment]);

  const yr5 = projections[projections.length - 1];

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
                background: "linear-gradient(135deg, hsl(142 72% 30% / 0.85), hsl(217 91% 45% / 0.75), hsl(142 72% 40% / 0.6), hsl(30 100% 55% / 0.4))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                  <Calendar className="w-3 h-3 text-white" />
                  <span className="text-white font-medium">Future Simulator</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                  Energy Future Simulator
                </h1>
                <p className="text-sm text-white/70 max-w-lg">
                  See the long-term impact of renewable energy decisions on your city and wallet.
                </p>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Input Panel */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-1">Simulation Inputs</h3>
                <p className="text-xs text-muted-foreground mb-6">Adjust parameters to project future</p>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-xs font-medium text-foreground">Monthly Usage</span><span className="text-xs font-bold text-primary">{usage} kWh</span></div>
                    <input type="range" min={100} max={2000} step={50} value={usage} onChange={e => setUsage(+e.target.value)}
                      className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-xs font-medium text-foreground">Adoption Level</span><span className="text-xs font-bold text-accent">{adoption}%</span></div>
                    <input type="range" min={10} max={90} value={adoption} onChange={e => setAdoption(+e.target.value)}
                      className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-xs font-medium text-foreground">Investment (₹)</span><span className="text-xs font-bold text-saffron">₹{investment.toLocaleString()}</span></div>
                    <input type="range" min={10000} max={500000} step={5000} value={investment} onChange={e => setInvestment(+e.target.value)}
                      className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-saffron [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-saffron [&::-webkit-slider-thumb]:shadow-md" />
                  </div>
                </div>
              </motion.div>

              {/* Projection Dashboard */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="lg:col-span-2 bg-card rounded-xl p-6 border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-5">5-Year Projection</h3>

                {/* Headline stat */}
                <div className="rounded-xl bg-primary/5 p-5 border border-primary/10 mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">By 2030, your city can be</p>
                  <motion.p key={yr5.renewable} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="text-5xl font-heading font-bold text-primary">{yr5.renewable}%</motion.p>
                  <p className="text-sm text-muted-foreground mt-1">renewable energy powered</p>
                </div>

                {/* Chart */}
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={projections}>
                    <defs>
                      <linearGradient id="futCarbon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="carbon" stroke="hsl(142 72% 40%)" fill="url(#futCarbon)" strokeWidth={2.5} name="CO₂ Saved (kg)" />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Summary grid */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {[
                    { label: "CO₂ Saved", value: `${yr5.carbon.toLocaleString()} kg`, color: "text-primary" },
                    { label: "Money Saved", value: `₹${yr5.money.toLocaleString()}`, color: "text-saffron" },
                    { label: "Renewable", value: `${yr5.renewable}%`, color: "text-accent" },
                    { label: "Independence", value: `${Math.round(yr5.independence)}%`, color: "text-foreground" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-muted/30 p-3 text-center">
                      <motion.p key={s.value} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className={`text-lg font-heading font-bold ${s.color}`}>{s.value}</motion.p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
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

export default FutureSimulator;

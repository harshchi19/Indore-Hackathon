// TODO: Backend integration partial — No city/zone API endpoint exists.
// Policy simulator and zone data are client-side. Connected: analytics for energy totals.
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { Building2, Sparkles, Sun, Wind, Zap, Leaf, Shield, TrendingUp, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";

/* TODO: Replace with API data when city/zone endpoints are available */

const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Pune"];

const energyMix = [
  { name: "Solar", value: 42, color: "hsl(30 100% 60%)" },
  { name: "Wind", value: 28, color: "hsl(217 91% 60%)" },
  { name: "Hydro", value: 18, color: "hsl(142 72% 40%)" },
  { name: "Biogas", value: 7, color: "hsl(280 60% 55%)" },
  { name: "Fossil", value: 5, color: "hsl(215 16% 47%)" },
];

const zones = [
  { name: "North Zone", status: "surplus", produced: 2400, consumed: 1800, suggestion: "Export excess to South Zone" },
  { name: "South Zone", status: "deficit", produced: 1200, consumed: 1900, suggestion: "Import from North or increase local solar" },
  { name: "East Zone", status: "balanced", produced: 1600, consumed: 1550, suggestion: "Maintain current production levels" },
  { name: "West Zone", status: "surplus", produced: 2100, consumed: 1700, suggestion: "Store surplus in battery reserve" },
  { name: "Central Zone", status: "deficit", produced: 900, consumed: 1400, suggestion: "Deploy micro-solar in residential areas" },
];

const zoneColors: Record<string, string> = {
  surplus: "bg-primary/10 border-primary/20 text-primary",
  deficit: "bg-destructive/10 border-destructive/20 text-destructive",
  balanced: "bg-accent/10 border-accent/20 text-accent",
};

const SmartCity = () => {
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [solarAdoption, setSolarAdoption] = useState(30);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  // Real analytics data for energy totals
  const { data: dashboard } = useAnalytics();

  const policyImpact = useMemo(() => {
    // Derive renewable % from energy_by_source when available
    const ebs = dashboard?.energy_by_source;
    const baseRenewable = ebs ? Math.round(
      Object.entries(ebs).filter(([k]) => ["solar","wind","hydro","biogas"].includes(k.toLowerCase())).reduce((s, [, v]) => s + v, 0)
      / Math.max(1, Object.values(ebs).reduce((s, v) => s + v, 0)) * 100
    ) : 55;
    const carbonReduction = Math.round(solarAdoption * 0.45);
    const energyIndependence = Math.round(40 + solarAdoption * 0.55);
    const renewableAdoption = Math.round(baseRenewable + solarAdoption * 0.4);
    const gridStability = Math.min(98, Math.round(75 + solarAdoption * 0.2));
    return { carbonReduction, energyIndependence, renewableAdoption, gridStability };
  }, [solarAdoption, dashboard]);

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
                background: "linear-gradient(135deg, hsl(217 91% 40% / 0.85), hsl(142 72% 35% / 0.7), hsl(280 50% 45% / 0.55), hsl(217 91% 55% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Building2 className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Command Center</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Smart City Renewable Command Center
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Real-time city-level energy intelligence and policy simulation.
                    {dashboard && (
                      <span className="block mt-1 text-white/60">
                        Platform total: {dashboard.total_energy_kwh?.toLocaleString() ?? "—"} kWh traded • {dashboard.total_co2_avoided_kg?.toLocaleString() ?? "—"} kg CO₂ avoided
                      </span>
                    )}
                  </p>
                </div>
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                  className="px-4 py-2 rounded-full bg-white/15 border border-white/20 text-white text-sm backdrop-blur-sm outline-none cursor-pointer">
                  {cities.map(c => <option key={c} value={c} className="text-foreground bg-card">{c}</option>)}
                </select>
              </div>
            </motion.div>

            {/* Renewable Score */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Renewable Adoption", value: `${policyImpact.renewableAdoption}%`, icon: Sun, gradient: "from-saffron/20 to-saffron/5" },
                { label: "Carbon Reduction", value: `${policyImpact.carbonReduction}%`, icon: Leaf, gradient: "from-primary/20 to-primary/5" },
                { label: "Energy Independence", value: `${policyImpact.energyIndependence}%`, icon: Zap, gradient: "from-accent/20 to-accent/5" },
                { label: "Grid Stability", value: `${policyImpact.gridStability}%`, icon: Shield, gradient: "from-primary/20 to-accent/5" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="group relative bg-card rounded-xl p-6 border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <motion.p key={stat.value} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="text-2xl font-heading font-bold text-foreground">{stat.value}</motion.p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Energy Mix Donut */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-4">Energy Source Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={energyMix} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {energyMix.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {energyMix.map(e => (
                    <div key={e.name} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                      <span className="text-muted-foreground">{e.name} {e.value}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Zone Map */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="lg:col-span-2 bg-card rounded-xl p-6 border border-border">
                <h3 className="font-heading font-semibold text-foreground mb-1">Energy Zone Map — {selectedCity}</h3>
                <p className="text-xs text-muted-foreground mb-4">Click a zone for details</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {zones.map((zone, i) => (
                    <button key={zone.name} onClick={() => setSelectedZone(selectedZone === i ? null : i)}
                      className={`rounded-xl p-4 border text-left transition-all duration-200 ${
                        selectedZone === i ? "ring-2 ring-primary/30 shadow-lg" : ""
                      } ${zoneColors[zone.status]}`}>
                      <p className="text-xs font-semibold mb-1">{zone.name}</p>
                      <p className="text-lg font-heading font-bold">{zone.produced} kWh</p>
                      <p className="text-[10px] opacity-70 capitalize">{zone.status}</p>
                    </button>
                  ))}
                </div>
                {selectedZone !== null && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl bg-muted/30 p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-heading font-semibold text-sm text-foreground">{zones[selectedZone].name}</h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${zoneColors[zones[selectedZone].status]}`}>
                        {zones[selectedZone].status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center rounded-lg bg-card p-2"><p className="text-sm font-bold text-foreground">{zones[selectedZone].produced} kWh</p><p className="text-[10px] text-muted-foreground">Produced</p></div>
                      <div className="text-center rounded-lg bg-card p-2"><p className="text-sm font-bold text-foreground">{zones[selectedZone].consumed} kWh</p><p className="text-[10px] text-muted-foreground">Consumed</p></div>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-primary">
                      <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{zones[selectedZone].suggestion}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Policy Simulator */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Policy Simulation Tool</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-6">What if more homes adopt solar? Drag the slider to simulate.</p>

              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">
                    Solar Adoption Rate: <span className="text-primary font-bold">{solarAdoption}%</span>
                  </label>
                  <input type="range" min={5} max={80} value={solarAdoption} onChange={e => setSolarAdoption(+e.target.value)}
                    className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>5%</span><span>80%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Carbon Reduction", value: `${policyImpact.carbonReduction}%`, color: "text-primary" },
                    { label: "Energy Independence", value: `${policyImpact.energyIndependence}%`, color: "text-accent" },
                    { label: "Renewable Share", value: `${policyImpact.renewableAdoption}%`, color: "text-saffron" },
                    { label: "Grid Stability", value: `${policyImpact.gridStability}%`, color: "text-foreground" },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl bg-muted/30 p-3 text-center">
                      <motion.p key={m.value} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className={`text-xl font-heading font-bold ${m.color}`}>{m.value}</motion.p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default SmartCity;

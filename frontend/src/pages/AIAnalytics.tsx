// AI Analytics Engine — price prediction, consumption analysis, sustainability score, recommendations.
// Calls: /ai/analytics/predict-price, /ai/analytics/consumption, /ai/analytics/sustainability, /ai/analytics/recommendations
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Zap, Leaf, Brain,
  Loader2, Sun, Wind, Droplets, Battery, AlertTriangle,
  Target, TreePine, Star, ArrowRight, Activity, Users2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useConsumptionAnalysis, usePricePrediction,
  useSustainabilityScore, useAIRecommendations,
} from "@/hooks/useAI";
import type { PricePrediction, ConsumptionAnalysis, SustainabilityScore, RecommendationResponse } from "@/types/ai";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend,
} from "recharts";

/* ── Static sample producers for recommendations ─────── */
const SAMPLE_PRODUCERS = [
  { id: "prod-01", name: "SolarEdge Gujarat", energy_type: "solar", price_kwh: 4.5, co2_kg_per_kwh: 0.04, reliability_pct: 98 },
  { id: "prod-02", name: "WindTech Pune", energy_type: "wind", price_kwh: 5.8, co2_kg_per_kwh: 0.02, reliability_pct: 93 },
  { id: "prod-03", name: "HydroFlow Kerala", energy_type: "hydro", price_kwh: 4.2, co2_kg_per_kwh: 0.01, reliability_pct: 99 },
  { id: "prod-04", name: "BioEnergy Maharashtra", energy_type: "biomass", price_kwh: 6.1, co2_kg_per_kwh: 0.12, reliability_pct: 87 },
];

/* ── Sample consumption readings ─────────────────────── */
const SAMPLE_READINGS = Array.from({ length: 12 }, (_, i) => ({
  timestamp: new Date(Date.now() - (11 - i) * 3600 * 1000).toISOString(),
  kwh: 45 + Math.sin(i * 0.7) * 15 + Math.random() * 8,
  source: ["solar", "grid", "wind"][i % 3],
}));

const TABS = ["Price Prediction", "Consumption Analysis", "Sustainability Score", "Recommendations"] as const;
type Tab = typeof TABS[number];

const ENERGY_TYPES = ["solar", "wind", "hydro", "grid", "biomass"] as const;
const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  solar: Sun, wind: Wind, hydro: Droplets, biomass: Battery, grid: Zap,
};

const trendConfig = {
  up: { icon: TrendingUp, color: "text-primary", label: "Rising", bg: "bg-primary/10" },
  down: { icon: TrendingDown, color: "text-destructive", label: "Falling", bg: "bg-destructive/10" },
  stable: { icon: Minus, color: "text-saffron", label: "Stable", bg: "bg-saffron/10" },
};

const confidenceColor: Record<string, string> = {
  high: "text-primary border-primary/30 bg-primary/10",
  medium: "text-saffron border-saffron/30 bg-saffron/10",
  low: "text-destructive border-destructive/30 bg-destructive/10",
};

export default function AIAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>("Price Prediction");

  /* Price Prediction state */
  const [energyType, setEnergyType] = useState<string>("solar");
  const [currentPrice, setCurrentPrice] = useState<string>("5.50");
  const [priceResult, setPriceResult] = useState<PricePrediction | null>(null);

  /* Consumption state */
  const [consumptionResult, setConsumptionResult] = useState<ConsumptionAnalysis | null>(null);

  /* Sustainability state */
  const [totalKwh, setTotalKwh] = useState<string>("500");
  const [greenKwh, setGreenKwh] = useState<string>("300");
  const [sustainResult, setSustainResult] = useState<SustainabilityScore | null>(null);

  /* Recommendations state */
  const [prefCost, setPrefCost] = useState(true);
  const [prefGreen, setPrefGreen] = useState(true);
  const [recResult, setRecResult] = useState<RecommendationResponse | null>(null);

  const priceMutation = usePricePrediction();
  const consumptionMutation = useConsumptionAnalysis();
  const sustainMutation = useSustainabilityScore();
  const recMutation = useAIRecommendations();

  /* ── Handlers ── */
  const handlePredictPrice = async () => {
    const res = await priceMutation.mutateAsync({
      energy_type: energyType,
      current_price: parseFloat(currentPrice) || 5.5,
      historical_prices: [4.8, 5.1, 5.3, 5.5, 5.2, 4.9, 5.4],
    }).catch(() => null);
    if (res) setPriceResult(res);
  };

  const handleConsumption = async () => {
    const res = await consumptionMutation.mutateAsync({
      readings: SAMPLE_READINGS,
    }).catch(() => null);
    if (res) setConsumptionResult(res);
  };

  const handleSustainability = async () => {
    const total = parseFloat(totalKwh) || 500;
    const green = Math.min(parseFloat(greenKwh) || 300, total);
    const res = await sustainMutation.mutateAsync({
      total_consumption_kwh: total,
      green_energy_kwh: green,
      certificates_owned: 3,
    }).catch(() => null);
    if (res) setSustainResult(res);
  };

  const handleRecommendations = async () => {
    const res = await recMutation.mutateAsync({
      user_preferences: { minimize_cost: prefCost, maximize_green: prefGreen, reliability: true },
      available_producers: SAMPLE_PRODUCERS,
      limit: 4,
    }).catch(() => null);
    if (res) setRecResult(res);
  };

  /* ── Chart helpers ── */
  const priceChartData = priceResult
    ? [
        { label: "3 days ago", price: (priceResult.current_price * 0.94).toFixed(2) },
        { label: "2 days ago", price: (priceResult.current_price * 0.97).toFixed(2) },
        { label: "Yesterday", price: (priceResult.current_price * 0.99).toFixed(2) },
        { label: "Now", price: priceResult.current_price.toFixed(2) },
        { label: "Predicted", price: priceResult.predicted_price.toFixed(2) },
      ]
    : [];

  const sustainChartData = sustainResult
    ? [{ name: "Score", value: sustainResult.overall_score, fill: "#22c55e" }]
    : [];

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative">
          <FloatingOrbs />
          <div className="max-w-[1200px] mx-auto space-y-6 relative z-10">

            {/* ── Hero Banner ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-8 lg:p-10"
            >
              <div
                className="absolute inset-0 animate-energy-flow"
                style={{
                  backgroundSize: "200% 200%",
                  background: "linear-gradient(135deg, hsl(200 80% 40% / 0.9), hsl(142 72% 35% / 0.7), hsl(260 70% 50% / 0.5))",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <BarChart3 className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">AI-Powered Energy Analytics</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    AI Analytics Engine
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Predict prices, analyse consumption patterns, measure sustainability impact, and get personalised producer recommendations.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeTab === t
                          ? "bg-white text-gray-900"
                          : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
              {/* Price Prediction */}
              {activeTab === "Price Prediction" && (
                <motion.div
                  key="price"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {/* Input card */}
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Price Prediction</h2>
                        <p className="text-xs text-muted-foreground">Predict next-period spot price using AI</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-muted-foreground">Energy Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {ENERGY_TYPES.map((et) => {
                          const Icon = sourceIcons[et] || Zap;
                          return (
                            <button
                              key={et}
                              onClick={() => setEnergyType(et)}
                              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors ${
                                energyType === et
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {et.charAt(0).toUpperCase() + et.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-muted-foreground">Current Price (₹/kWh)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentPrice}
                        onChange={(e) => setCurrentPrice(e.target.value)}
                        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>

                    <Button
                      onClick={handlePredictPrice}
                      disabled={priceMutation.isPending}
                      className="w-full gap-2"
                    >
                      {priceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      Predict Price
                    </Button>
                  </div>

                  {/* Result card */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    {!priceResult && !priceMutation.isPending && (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-12">
                        <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center">
                          <Activity className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Run prediction to see results</p>
                      </div>
                    )}
                    {priceMutation.isPending && (
                      <div className="h-full flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">Analysing market data…</p>
                        </div>
                      </div>
                    )}
                    {priceResult && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Target className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">Prediction Result</h3>
                            <p className="text-xs text-muted-foreground">
                              {energyType.charAt(0).toUpperCase() + energyType.slice(1)} energy
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl bg-muted/30 p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Current</p>
                            <p className="text-lg font-bold font-heading text-foreground">₹{priceResult.current_price.toFixed(2)}</p>
                          </div>
                          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Predicted</p>
                            <p className="text-lg font-bold font-heading text-primary">₹{priceResult.predicted_price.toFixed(2)}</p>
                          </div>
                          <div className="rounded-xl bg-muted/30 p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Change</p>
                            <p className={`text-lg font-bold font-heading ${priceResult.change_percent >= 0 ? "text-destructive" : "text-primary"}`}>
                              {priceResult.change_percent >= 0 ? "+" : ""}{priceResult.change_percent.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {(() => {
                            const cfg = trendConfig[priceResult.trend];
                            return (
                              <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                                <cfg.icon className="w-3 h-3" /> {cfg.label}
                              </span>
                            );
                          })()}
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${confidenceColor[priceResult.confidence]}`}>
                            {priceResult.confidence} confidence
                          </span>
                        </div>

                        {priceResult.best_time_to_buy && (
                          <div className="rounded-xl bg-accent/10 border border-accent/20 p-3">
                            <p className="text-xs font-medium text-accent mb-0.5">Best time to buy</p>
                            <p className="text-xs text-muted-foreground">{priceResult.best_time_to_buy}</p>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-3">{priceResult.reasoning}</p>

                        {priceChartData.length > 0 && (
                          <div className="h-28">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={priceChartData}>
                                <defs>
                                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} />
                                <Tooltip
                                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                                  formatter={(v: number) => [`₹${v}`, "Price"]}
                                />
                                <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="url(#priceGrad)" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Consumption Analysis */}
              {activeTab === "Consumption Analysis" && (
                <motion.div
                  key="consumption"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Sample readings preview */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">Consumption Analysis</h2>
                          <p className="text-xs text-muted-foreground">Using last 12 hourly smart meter readings</p>
                        </div>
                      </div>
                      <Button onClick={handleConsumption} disabled={consumptionMutation.isPending} className="gap-2">
                        {consumptionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                        Analyse
                      </Button>
                    </div>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={SAMPLE_READINGS.map((r, i) => ({ hour: `T-${11 - i}h`, kwh: r.kwh.toFixed(1), source: r.source }))}>
                          <defs>
                            <linearGradient id="consumGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} unit=" kWh" />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                            formatter={(v: number) => [`${v} kWh`, "Consumption"]}
                          />
                          <Area type="monotone" dataKey="kwh" stroke="hsl(var(--accent))" fill="url(#consumGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Result */}
                  {consumptionMutation.isPending && (
                    <div className="rounded-2xl border border-border bg-card p-10 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">AI is analysing your consumption patterns…</p>
                      </div>
                    </div>
                  )}

                  {consumptionResult && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {/* Key metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: "Total kWh", value: `${consumptionResult.total_kwh.toFixed(1)} kWh`, icon: Zap, gradient: "from-primary/20 to-primary/5" },
                          { label: "Daily Average", value: `${consumptionResult.average_daily_kwh.toFixed(1)} kWh`, icon: Activity, gradient: "from-accent/20 to-accent/5" },
                          { label: "Peak Hour", value: `${consumptionResult.peak_hour}:00`, icon: TrendingUp, gradient: "from-saffron/20 to-saffron/5" },
                          { label: "Trend", value: consumptionResult.trend.charAt(0).toUpperCase() + consumptionResult.trend.slice(1), icon: trendConfig[consumptionResult.trend].icon, gradient: "from-primary/20 to-accent/5" },
                        ].map((s) => (
                          <div key={s.label} className={`rounded-xl bg-gradient-to-br ${s.gradient} border border-border/50 p-4`}>
                            <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
                            <p className="text-lg font-bold font-heading">{s.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Anomalies */}
                      {consumptionResult.anomalies.length > 0 && (
                        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <h3 className="text-sm font-semibold text-foreground">Anomalies Detected</h3>
                          </div>
                          <ul className="space-y-1.5">
                            {consumptionResult.anomalies.map((a, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Insights */}
                      <div className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="text-sm font-semibold text-foreground mb-4">AI Insights</h3>
                        <div className="space-y-3">
                          {consumptionResult.insights.map((ins, i) => (
                            <div key={i} className={`rounded-xl p-4 border-l-4 ${
                              ins.impact === "savings" ? "border-l-primary bg-primary/5" :
                              ins.impact === "efficiency" ? "border-l-accent bg-accent/5" :
                              "border-l-saffron bg-saffron/5"
                            }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold text-foreground">{ins.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ins.description}</p>
                                  {ins.action && (
                                    <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                                      <ArrowRight className="w-3 h-3" /> {ins.action}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground flex-shrink-0 capitalize">{ins.impact}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Recommendations</h3>
                        <ul className="space-y-2">
                          {consumptionResult.recommendations.map((r, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Sustainability Score */}
              {activeTab === "Sustainability Score" && (
                <motion.div
                  key="sustainability"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {/* Input */}
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Sustainability Score</h2>
                        <p className="text-xs text-muted-foreground">Calculate your green energy impact</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-medium text-muted-foreground">Total Consumption</label>
                          <span className="font-mono text-foreground">{totalKwh} kWh</span>
                        </div>
                        <input
                          type="range" min="100" max="2000" step="50"
                          value={totalKwh}
                          onChange={(e) => {
                            setTotalKwh(e.target.value);
                            if (parseFloat(greenKwh) > parseFloat(e.target.value)) setGreenKwh(e.target.value);
                          }}
                          className="w-full accent-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-medium text-muted-foreground">Green Energy Used</label>
                          <span className="font-mono text-primary">{greenKwh} kWh ({Math.round((parseFloat(greenKwh) / parseFloat(totalKwh)) * 100)}%)</span>
                        </div>
                        <input
                          type="range" min="0" max={totalKwh} step="10"
                          value={greenKwh}
                          onChange={(e) => setGreenKwh(e.target.value)}
                          className="w-full accent-primary"
                        />
                      </div>
                    </div>

                    {/* Visual preview bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Carbon Energy</span>
                        <span>Green Energy</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, (parseFloat(greenKwh) / parseFloat(totalKwh)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <Button onClick={handleSustainability} disabled={sustainMutation.isPending} className="w-full gap-2">
                      {sustainMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      Calculate Score
                    </Button>
                  </div>

                  {/* Result */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    {!sustainResult && !sustainMutation.isPending && (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-12">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <TreePine className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Your sustainability score will appear here</p>
                      </div>
                    )}
                    {sustainMutation.isPending && (
                      <div className="h-full flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">Calculating your green impact…</p>
                        </div>
                      </div>
                    )}
                    {sustainResult && (
                      <div className="space-y-5">
                        {/* Score gauge */}
                        <div className="flex items-center justify-center">
                          <div className="h-48">
                            <ResponsiveContainer width={200} height={200}>
                              <RadialBarChart cx={100} cy={100} innerRadius={55} outerRadius={90} data={sustainChartData} startAngle={180} endAngle={-180}>
                                <RadialBar background dataKey="value" cornerRadius={8} />
                              </RadialBarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="text-center -ml-6">
                            <p className="text-4xl font-heading font-bold text-primary">{sustainResult.overall_score}</p>
                            <p className="text-xs text-muted-foreground">/100</p>
                            <span className="mt-1 inline-block text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">{sustainResult.ranking}</span>
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl bg-primary/10 p-3 text-center">
                            <p className="text-lg font-bold font-heading text-primary">{sustainResult.green_percentage}%</p>
                            <p className="text-[10px] text-muted-foreground">Green %</p>
                          </div>
                          <div className="rounded-xl bg-muted/30 p-3 text-center">
                            <p className="text-lg font-bold font-heading text-foreground">{sustainResult.carbon_saved_kg.toFixed(0)} kg</p>
                            <p className="text-[10px] text-muted-foreground">CO₂ Saved</p>
                          </div>
                          <div className="rounded-xl bg-accent/10 p-3 text-center">
                            <p className="text-lg font-bold font-heading text-accent">{sustainResult.tree_equivalent}</p>
                            <p className="text-[10px] text-muted-foreground">Trees eq.</p>
                          </div>
                        </div>
                        {/* Tips */}
                        <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                          <p className="text-xs font-semibold text-foreground mb-2">Improvement Tips</p>
                          {sustainResult.improvement_tips.map((tip, i) => (
                            <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <Leaf className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Recommendations */}
              {activeTab === "Recommendations" && (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Config */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-saffron/10 flex items-center justify-center">
                          <Users2 className="w-5 h-5 text-saffron" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">Producer Recommendations</h2>
                          <p className="text-xs text-muted-foreground">AI matches you with the best producers</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                          <input type="checkbox" checked={prefCost} onChange={(e) => setPrefCost(e.target.checked)} className="accent-primary" />
                          Minimize Cost
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                          <input type="checkbox" checked={prefGreen} onChange={(e) => setPrefGreen(e.target.checked)} className="accent-primary" />
                          Maximize Green
                        </label>
                        <Button onClick={handleRecommendations} disabled={recMutation.isPending} className="gap-2">
                          {recMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                          Get Recommendations
                        </Button>
                      </div>
                    </div>

                    {/* Available producers */}
                    <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {SAMPLE_PRODUCERS.map((p) => {
                        const Icon = sourceIcons[p.energy_type] || Zap;
                        return (
                          <div key={p.id} className="rounded-xl border border-border bg-muted/20 p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-foreground truncate">{p.name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground space-y-0.5">
                              <div className="flex justify-between"><span>Price</span><span className="text-foreground font-mono">₹{p.price_kwh}/kWh</span></div>
                              <div className="flex justify-between"><span>Reliability</span><span className="text-foreground">{p.reliability_pct}%</span></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Results */}
                  {recMutation.isPending && (
                    <div className="rounded-2xl border border-border bg-card p-10 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Analysing producer matches…</p>
                      </div>
                    </div>
                  )}

                  {recResult && recResult.recommendations.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      {recResult.recommendations.map((rec, i) => {
                        const producer = SAMPLE_PRODUCERS.find(p => p.id === rec.producer_id) ?? SAMPLE_PRODUCERS[i % SAMPLE_PRODUCERS.length];
                        const Icon = sourceIcons[producer.energy_type] || Zap;
                        return (
                          <div key={rec.producer_id} className="rounded-2xl border border-border bg-card p-5 flex items-start gap-5">
                            <div className="flex-shrink-0 flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground">{producer.name}</h4>
                                  <p className="text-xs text-muted-foreground">₹{producer.price_kwh}/kWh · {producer.reliability_pct}% reliability</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }, (_, j) => (
                                      <Star key={j} className={`w-3 h-3 ${j < Math.round(rec.match_score / 20) ? "text-saffron fill-saffron" : "text-muted-foreground/30"}`} />
                                    ))}
                                  </div>
                                  <span className="text-xs font-bold text-primary">{rec.match_score}%</span>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {rec.reasons.map((r, ri) => (
                                  <span key={ri} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{r}</span>
                                ))}
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                <Leaf className="w-3 h-3 text-primary" /> Potential savings: {rec.potential_savings}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}

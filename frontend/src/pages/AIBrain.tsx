// AI-powered Energy Intelligence + City Planner — connected to all AI backend endpoints.
// Map & zone data are client-side only. Connected: pricing + analytics + AI assistant/analytics/voice.
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, AlertTriangle, Sun, Wind, Droplets, Activity, MapPin, Play, Leaf, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAIHealth, usePricePrediction, useSustainabilityScore } from "@/hooks/useAI";
import AIChatPanel from "@/components/AIChatPanel";
import AIVoicePanel from "@/components/AIVoicePanel";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Data (TODO: Replace with API data when AI/ML endpoints are available) ── */
const demandPrediction = [
  { hour: "Now", demand: 420, predicted: 420 }, { hour: "+2h", demand: 380, predicted: 390 },
  { hour: "+4h", demand: 360, predicted: 370 }, { hour: "+6h", demand: 480, predicted: 510 },
  { hour: "+8h", demand: 620, predicted: 680 }, { hour: "+10h", demand: 580, predicted: 620 },
  { hour: "+12h", demand: 440, predicted: 450 }, { hour: "+14h", demand: 320, predicted: 330 },
  { hour: "+16h", demand: 280, predicted: 290 }, { hour: "+18h", demand: 350, predicted: 360 },
  { hour: "+20h", demand: 410, predicted: 430 }, { hour: "+24h", demand: 390, predicted: 400 },
];

const defaultInsights = [
  { text: "Switching 20% of homes to solar will reduce city carbon by 12%.", type: "strategy", time: "2m ago" },
  { text: "Wind supply surplus predicted tomorrow 6AM–12PM. Store or sell excess.", type: "opportunity", time: "5m ago" },
  { text: "Peak demand alert: 7PM surge expected. Pre-charge battery reserves.", type: "alert", time: "8m ago" },
  { text: "Solar panel efficiency up 3% this week due to clear weather forecast.", type: "insight", time: "12m ago" },
  { text: "Nearby producer offering ₹4.2/kWh — 28% below your current average.", type: "opportunity", time: "15m ago" },
  { text: "Carbon credit price rising. Consider holding credits for 48 more hours.", type: "strategy", time: "20m ago" },
];

const insightColors: Record<string, string> = {
  strategy: "border-l-primary bg-primary/5",
  opportunity: "border-l-accent bg-accent/5",
  alert: "border-l-saffron bg-saffron/5",
  insight: "border-l-primary bg-muted/30",
};

const sources = [
  { name: "SolarFarm Alpha", type: "Solar", icon: Sun, price: 5.2, carbon: 140, reliability: 98, distance: 2.1, score: 0 },
  { name: "WindTech Pune", type: "Wind", icon: Wind, price: 6.0, carbon: 95, reliability: 94, distance: 5.4, score: 0 },
  { name: "HydroFlow Kerala", type: "Hydro", icon: Droplets, price: 4.8, carbon: 155, reliability: 99, distance: 12.0, score: 0 },
];

/* ── Map data ────────────────────────────────────── */
const PUNE_CENTER: L.LatLngExpression = [18.5204, 73.8567];

const zonePolygons = [
  { label: "Koregaon Park — Residential", color: "#3b82f6", coords: [[18.536,73.893],[18.542,73.902],[18.530,73.910],[18.524,73.900]] as L.LatLngExpression[] },
  { label: "Kothrud — Residential", color: "#3b82f6", coords: [[18.505,73.808],[18.515,73.815],[18.508,73.825],[18.498,73.818]] as L.LatLngExpression[] },
  { label: "Hinjewadi IT Park — Commercial", color: "#8b5cf6", coords: [[18.590,73.715],[18.600,73.725],[18.592,73.740],[18.582,73.730]] as L.LatLngExpression[] },
  { label: "Pimpri-Chinchwad — Industrial", color: "#6b7280", coords: [[18.620,73.790],[18.635,73.800],[18.628,73.818],[18.613,73.808]] as L.LatLngExpression[] },
  { label: "Hadapsar — Commercial", color: "#8b5cf6", coords: [[18.500,73.930],[18.510,73.945],[18.498,73.955],[18.488,73.940]] as L.LatLngExpression[] },
  { label: "Wagholi — Demand Hotspot", color: "#f59e0b", coords: [[18.580,73.975],[18.590,73.990],[18.578,73.998],[18.568,73.983]] as L.LatLngExpression[] },
];

const existingRenewables = [
  { label: "Existing Solar Farm", pos: [18.460, 73.750] as L.LatLngExpression, emoji: "☀️", color: "#f97316" },
  { label: "Existing Wind Farm", pos: [18.650, 73.850] as L.LatLngExpression, emoji: "🌀", color: "#3b82f6" },
];

const aiPinData = [
  { id: "ai-s1", label: "AI: Solar Hub — Baner", pos: [18.560, 73.780] as L.LatLngExpression, emoji: "☀️", color: "#f97316" },
  { id: "ai-s2", label: "AI: Solar Hub — Viman Nagar", pos: [18.567, 73.915] as L.LatLngExpression, emoji: "☀️", color: "#f97316" },
  { id: "ai-s3", label: "AI: Solar Hub — Undri", pos: [18.465, 73.895] as L.LatLngExpression, emoji: "☀️", color: "#f97316" },
  { id: "ai-w1", label: "AI: Wind Turbine — Lavasa Rd", pos: [18.410, 73.510] as L.LatLngExpression, emoji: "🌀", color: "#3b82f6" },
  { id: "ai-w2", label: "AI: Wind Turbine — Talegaon", pos: [18.730, 73.680] as L.LatLngExpression, emoji: "🌀", color: "#3b82f6" },
  { id: "ai-b1", label: "AI: Battery — Shivajinagar", pos: [18.530, 73.845] as L.LatLngExpression, emoji: "🔋", color: "#22c55e" },
  { id: "ai-b2", label: "AI: Battery — Kharadi", pos: [18.550, 73.940] as L.LatLngExpression, emoji: "🔋", color: "#22c55e" },
];

const futurePinData = [
  { id: "f-s1", label: "2030: Solar — Wakad", pos: [18.598, 73.762] as L.LatLngExpression, emoji: "☀️", color: "#f97316" },
  { id: "f-s2", label: "2030: Solar — Kondhwa", pos: [18.470, 73.875] as L.LatLngExpression, emoji: "☀️", color: "#f97316" },
  { id: "f-w1", label: "2030: Wind — Mulshi", pos: [18.500, 73.550] as L.LatLngExpression, emoji: "🌀", color: "#3b82f6" },
  { id: "f-b1", label: "2035: Battery — Camp", pos: [18.515, 73.880] as L.LatLngExpression, emoji: "🔋", color: "#22c55e" },
  { id: "f-s3", label: "2035: Solar — Sinhagad Rd", pos: [18.475, 73.810] as L.LatLngExpression, emoji: "☀️", color: "#f97316" },
  { id: "f-w2", label: "2035: Wind — Chakan", pos: [18.760, 73.860] as L.LatLngExpression, emoji: "🌀", color: "#3b82f6" },
];

const energyFlows: { from: L.LatLngExpression; to: L.LatLngExpression; color: string }[] = [
  { from: [18.460,73.750], to: [18.505,73.808], color: "#f97316" },
  { from: [18.460,73.750], to: [18.530,73.845], color: "#22c55e" },
  { from: [18.650,73.850], to: [18.620,73.790], color: "#3b82f6" },
  { from: [18.650,73.850], to: [18.590,73.715], color: "#3b82f6" },
  { from: [18.530,73.845], to: [18.536,73.893], color: "#22c55e" },
  { from: [18.530,73.845], to: [18.500,73.930], color: "#22c55e" },
];

const makeIcon = (emoji: string, color: string, pulsing = false) =>
  L.divIcon({
    className: "custom-div-icon",
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 ${pulsing ? "12" : "6"}px ${color}44;${pulsing ? `animation:marker-pulse 2s infinite;` : ""}">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

/* ── Imperative Leaflet Map Component ────────────── */
const CityMap = ({ aiOptimized, deployedPins, futureMode }: { aiOptimized: boolean; deployedPins: string[]; futureMode: string }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const aiLayerRef = useRef<L.LayerGroup | null>(null);
  const futureLayerRef = useRef<L.LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: PUNE_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
    }).addTo(map);

    // Zone polygons
    zonePolygons.forEach(zone => {
      L.polygon(zone.coords, { color: zone.color, fillColor: zone.color, fillOpacity: 0.12, weight: 2, opacity: 0.5 })
        .bindPopup(`<strong style="font-size:12px">${zone.label}</strong>`)
        .addTo(map);
    });

    // Existing renewables
    existingRenewables.forEach(r => {
      L.marker(r.pos, { icon: makeIcon(r.emoji, r.color) })
        .bindPopup(`<strong style="font-size:12px">${r.label}</strong>`)
        .addTo(map);
    });

    // Energy flow lines
    energyFlows.forEach(flow => {
      L.polyline([flow.from, flow.to], { color: flow.color, weight: 2, opacity: 0.4, dashArray: "8 6" }).addTo(map);
    });

    // AI + Future layer groups
    aiLayerRef.current = L.layerGroup().addTo(map);
    futureLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Resize fix
    setTimeout(() => map.invalidateSize(), 400);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update AI pins
  useEffect(() => {
    if (!aiLayerRef.current) return;
    aiLayerRef.current.clearLayers();
    if (!aiOptimized) return;

    aiPinData.forEach(pin => {
      if (deployedPins.includes(pin.id)) {
        L.marker(pin.pos, { icon: makeIcon(pin.emoji, pin.color, true) })
          .bindPopup(`<strong style="font-size:12px">🤖 ${pin.label}</strong>`)
          .addTo(aiLayerRef.current!);
      }
    });
  }, [aiOptimized, deployedPins]);

  // Update future pins
  useEffect(() => {
    if (!futureLayerRef.current) return;
    futureLayerRef.current.clearLayers();

    const pins = futureMode === "present" ? [] : futureMode === "2030" ? futurePinData.slice(0, 3) : futurePinData;
    pins.forEach(pin => {
      L.marker(pin.pos, { icon: makeIcon(pin.emoji, pin.color) })
        .bindPopup(`<strong style="font-size:12px">🔮 ${pin.label}</strong>`)
        .addTo(futureLayerRef.current!);
    });
  }, [futureMode]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "480px" }} />;
};

/* ── Main Component ───────────────────────────────── */
const AIBrain = () => {
  const [budget, setBudget] = useState(50);
  const [carbon, setCarbon] = useState(70);
  const [reliability, setReliability] = useState(60);
  const [locality, setLocality] = useState(40);
  const [aiOptimized, setAiOptimized] = useState(false);
  const [futureMode, setFutureMode] = useState<"present" | "2030" | "2035">("present");
  const [deployedPins, setDeployedPins] = useState<string[]>([]);

  // Live data feeds for AI-enhanced recommendations
  const { data: dashboard } = useAnalytics();

  // AI service hooks
  const { data: aiHealth } = useAIHealth();
  const pricePrediction = usePricePrediction();
  const sustainabilityMutation = useSustainabilityScore();

  // Fetch price prediction on mount
  useEffect(() => {
    if (!pricePrediction.data && !pricePrediction.isPending) {
      pricePrediction.mutate({ energy_type: "solar", current_price: 5.5 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch sustainability score from dashboard data
  useEffect(() => {
    if (dashboard && !sustainabilityMutation.data && !sustainabilityMutation.isPending) {
      const ebs = dashboard.energy_by_source ?? {};
      const total = Object.values(ebs).reduce((s, v) => s + v, 0);
      const green = Object.entries(ebs)
        .filter(([k]) => ["solar", "wind", "hydro", "biogas"].includes(k.toLowerCase()))
        .reduce((s, [, v]) => s + v, 0);
      sustainabilityMutation.mutate({
        total_consumption_kwh: total || 1000,
        green_energy_kwh: green || 400,
        certificates_owned: 3,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard]);

  // Build live insights from AI data
  const insights = useMemo(() => {
    const live: typeof defaultInsights = [];

    // Price prediction insight
    if (pricePrediction.data) {
      const pp = pricePrediction.data;
      const dir = pp.trend === "up" ? "rising" : pp.trend === "down" ? "falling" : "stable";
      live.push({
        text: `Solar price ${dir}: ₹${pp.current_price} → ₹${pp.predicted_price} (${pp.change_percent > 0 ? "+" : ""}${pp.change_percent.toFixed(1)}%). ${pp.reasoning}`,
        type: pp.trend === "up" ? "alert" : "opportunity",
        time: "Just now",
      });
      if (pp.best_time_to_buy) {
        live.push({
          text: `Best time to buy energy: ${pp.best_time_to_buy}`,
          type: "strategy",
          time: "Just now",
        });
      }
    }

    // Sustainability insight
    if (sustainabilityMutation.data) {
      const ss = sustainabilityMutation.data;
      live.push({
        text: `Sustainability: ${ss.ranking} (${ss.overall_score}/100). ${ss.green_percentage}% green energy. ${ss.carbon_saved_kg.toFixed(0)}kg CO₂ saved (≈${ss.tree_equivalent} trees).`,
        type: "insight",
        time: "Just now",
      });
      ss.improvement_tips.slice(0, 2).forEach((tip) => {
        live.push({ text: tip, type: "strategy", time: "AI tip" });
      });
    }

    // AI health status insight
    if (aiHealth) {
      const svc = aiHealth.services;
      const active = [
        svc.assistant.groq && "Groq",
        svc.assistant.gemini && "Gemini",
        svc.voice.sarvam && "Sarvam TTS",
      ].filter(Boolean);
      if (active.length > 0) {
        live.push({
          text: `AI models online: ${active.join(", ")}. All analytics available.`,
          type: "insight",
          time: "Live",
        });
      }
    }

    // Fill remaining slots with defaults so feed is never empty
    const remaining = defaultInsights.filter(
      (d) => !live.some((l) => l.text === d.text),
    );
    return [...live, ...remaining].slice(0, 8);
  }, [pricePrediction.data, sustainabilityMutation.data, aiHealth]);

  const recommendation = useMemo(() => {
    const scored = sources.map(s => {
      const adjustedPrice = s.price;
      const priceScore = (1 - adjustedPrice / 10) * budget;
      const carbonScore = (s.carbon / 200) * carbon;
      const relScore = (s.reliability / 100) * reliability;
      const locScore = (1 - s.distance / 15) * locality;
      const total = Math.round(((priceScore + carbonScore + relScore + locScore) / (budget + carbon + reliability + locality)) * 100);
      return { ...s, score: Math.min(99, Math.max(60, total)) };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [budget, carbon, reliability, locality, liveAvgPrice]);

  const best = recommendation[0];

  const handleOptimize = useCallback(() => {
    if (aiOptimized) return;
    setAiOptimized(true);
    setDeployedPins([]);
    aiPinData.forEach((pin, i) => {
      setTimeout(() => setDeployedPins(p => [...p, pin.id]), i * 300);
    });
  }, [aiOptimized]);

  const mapStats = useMemo(() => {
    // Derive renewable % from energy_by_source when dashboard is available
    const ebs = dashboard?.energy_by_source;
    const baseRenewable = ebs ? Math.round(
      Object.entries(ebs).filter(([k]) => ["solar","wind","hydro","biogas"].includes(k.toLowerCase())).reduce((s, [, v]) => s + v, 0)
      / Math.max(1, Object.values(ebs).reduce((s, v) => s + v, 0)) * 100
    ) : 42;
    let renewable = baseRenewable, balance = 68, carbonRed = 22, stability = 78;
    if (aiOptimized) { renewable += 24; balance += 18; carbonRed += 15; stability += 12; }
    if (futureMode === "2030") { renewable += 18; balance += 10; carbonRed += 12; stability += 8; }
    if (futureMode === "2035") { renewable += 30; balance += 15; carbonRed += 20; stability += 12; }
    return {
      renewable: Math.min(98, renewable), balance: Math.min(99, balance),
      carbonReduction: Math.min(95, carbonRed), stability: Math.min(99, stability),
    };
  }, [aiOptimized, futureMode, dashboard]);

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative">
          <FloatingOrbs />
          <div className="max-w-[1400px] mx-auto space-y-6 relative z-10">

            {/* Hero Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-8 lg:p-10">
              <div className="absolute inset-0 animate-energy-flow" style={{
                backgroundSize: "200% 200%",
                background: "linear-gradient(135deg, hsl(270 60% 40% / 0.8), hsl(217 91% 50% / 0.75), hsl(142 72% 35% / 0.65), hsl(270 50% 50% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Brain className="w-3 h-3 text-white animate-pulse" />
                    <span className="text-white font-medium">GridMind AI Active</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    AI Energy Intelligence + City Planner
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Real-world map intelligence — watch AI optimize infrastructure placement across Pune.
                  </p>
                </div>
                <div className="text-center">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                      <motion.circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={264} initial={{ strokeDashoffset: 264 }}
                        animate={{ strokeDashoffset: 264 * (1 - mapStats.renewable / 100) }}
                        transition={{ duration: 1.5 }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span key={mapStats.renewable} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="text-2xl font-heading font-bold text-white">{mapStats.renewable}%</motion.span>
                      <span className="text-[9px] text-white/60">Renewable</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/50 mt-1">City Score</p>
                </div>
              </div>
            </motion.div>

            {/* Main: Left Panel + Map */}
            <div className="grid lg:grid-cols-10 gap-6">

              {/* Left: Controls (~35%) */}
              <div className="lg:col-span-4 space-y-5">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-heading font-semibold text-foreground text-sm mb-1">AI Preference Controls</h3>
                  <p className="text-[10px] text-muted-foreground mb-4">Adjust to recalculate recommendation</p>
                  {[
                    { label: "Budget Sensitivity", value: budget, set: setBudget },
                    { label: "Carbon Priority", value: carbon, set: setCarbon },
                    { label: "Reliability", value: reliability, set: setReliability },
                    { label: "Locality Preference", value: locality, set: setLocality },
                  ].map(s => (
                    <div key={s.label} className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-foreground">{s.label}</span>
                        <span className="text-[11px] font-bold text-primary">{s.value}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={s.value} onChange={e => s.set(+e.target.value)}
                        className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                    </div>
                  ))}
                </motion.div>

                {/* AI Best Pick */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-card rounded-xl p-5 border border-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] blur-[50px] rounded-full" style={{ background: "hsl(142 72% 40%)" }} />
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <h3 className="font-heading font-semibold text-foreground text-sm">AI Recommendation</h3>
                  </div>
                  <div className="relative z-10 rounded-xl bg-primary/5 p-4 border border-primary/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <best.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-sm text-foreground">{best.name}</h4>
                          <span className="text-[10px] text-muted-foreground">{best.type} • {best.distance}km</span>
                        </div>
                      </div>
                      <motion.span key={best.score} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        className="text-2xl font-heading font-bold text-primary">{best.score}%</motion.span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                      <motion.div key={best.score} initial={{ width: 0 }} animate={{ width: `${best.score}%` }}
                        transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { v: `₹${best.price}`, l: "/kWh", c: "text-foreground" },
                        { v: `${best.carbon}kg`, l: "CO₂ saved", c: "text-primary" },
                        { v: `${best.reliability}%`, l: "Reliable", c: "text-foreground" },
                      ].map(d => (
                        <div key={d.l} className="rounded-lg bg-muted/30 p-1.5">
                          <p className={`text-sm font-heading font-bold ${d.c}`}>{d.v}</p>
                          <p className="text-[9px] text-muted-foreground">{d.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 relative z-10">
                    {recommendation.slice(1).map(src => (
                      <div key={src.name} className="flex items-center justify-between rounded-lg bg-muted/20 p-2.5">
                        <div className="flex items-center gap-2">
                          <src.icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-[11px] font-medium text-foreground">{src.name}</p>
                            <p className="text-[9px] text-muted-foreground">₹{src.price}/kWh</p>
                          </div>
                        </div>
                        <span className="text-sm font-heading font-bold text-muted-foreground">{src.score}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Strategy Feed */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="bg-card rounded-xl p-5 border border-border max-h-[300px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <h3 className="font-heading font-semibold text-foreground text-sm">AI Strategy Feed</h3>
                    <span className="text-[9px] text-primary font-medium ml-auto flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live
                    </span>
                  </div>
                  <div className="space-y-2">
                    {insights.map((insight, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.06 }}
                        className={`rounded-lg p-3 border-l-[3px] ${insightColors[insight.type]}`}>
                        <p className="text-[11px] text-foreground leading-relaxed">{insight.text}</p>
                        <span className="text-[9px] text-muted-foreground">{insight.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right: Leaflet Map (~65%) */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="lg:col-span-6 bg-card rounded-xl border border-border overflow-hidden relative flex flex-col">

                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2 relative z-[500]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-heading font-semibold text-foreground text-sm">Smart City Map — Pune</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["present", "2030", "2035"] as const).map(v => (
                      <button key={v} onClick={() => setFutureMode(v)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                          futureMode === v ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}>{v === "present" ? "Present" : v}</button>
                    ))}
                  </div>
                </div>

                {/* Map container */}
                <div className="flex-1 relative" style={{ minHeight: "480px" }}>
                  <CityMap aiOptimized={aiOptimized} deployedPins={deployedPins} futureMode={futureMode} />

                  {/* Floating Stats */}
                  <div className="absolute top-3 right-3 z-[1000] glass rounded-xl p-3 w-40 space-y-2">
                    {[
                      { label: "Renewable %", value: `${mapStats.renewable}%`, color: "text-primary" },
                      { label: "Energy Balance", value: `${mapStats.balance}%`, color: "text-accent" },
                      { label: "Carbon Cut", value: `${mapStats.carbonReduction}%`, color: "text-saffron" },
                      { label: "Grid Stability", value: `${mapStats.stability}%`, color: "text-foreground" },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground">{s.label}</span>
                        <motion.span key={s.value} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                          className={`text-xs font-heading font-bold ${s.color}`}>{s.value}</motion.span>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-3 left-3 z-[1000] glass rounded-lg p-2 flex flex-wrap gap-x-3 gap-y-1">
                    {[
                      { label: "Residential", color: "#3b82f6" },
                      { label: "Industrial", color: "#6b7280" },
                      { label: "Commercial", color: "#8b5cf6" },
                      { label: "Renewable", color: "#22c55e" },
                      { label: "Demand", color: "#f59e0b" },
                    ].map(l => (
                      <span key={l.label} className="flex items-center gap-1 text-[8px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action bar */}
                <div className="px-5 py-3 flex items-center gap-3 border-t border-border">
                  <button onClick={handleOptimize} disabled={aiOptimized}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      aiOptimized
                        ? "bg-primary/10 text-primary border border-primary/20 cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg glossy"
                    }`}>
                    {aiOptimized ? (
                      <><Sparkles className="w-3.5 h-3.5" /> AI Optimization Applied — {deployedPins.length} hubs deployed</>
                    ) : (
                      <><Play className="w-3.5 h-3.5" /> Apply AI Optimization</>
                    )}
                  </button>
                  {aiOptimized && (
                    <button onClick={() => { setAiOptimized(false); setDeployedPins([]); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium bg-muted/50 text-muted-foreground hover:text-foreground border border-border transition-all">
                      Reset
                    </button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Demand Prediction */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">24-Hour Demand Prediction</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">AI forecasted energy demand curve</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-saffron/10 border border-saffron/20">
                  <AlertTriangle className="w-3 h-3 text-saffron" />
                  <span className="text-[11px] text-saffron font-semibold">Peak at +8h (7 PM)</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={demandPrediction}>
                  <defs>
                    <linearGradient id="aiDemand2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="aiPredicted2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(30 100% 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(30 100% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                  <Area type="monotone" dataKey="demand" stroke="hsl(217 91% 60%)" fill="url(#aiDemand2)" strokeWidth={2} name="Actual" />
                  <Area type="monotone" dataKey="predicted" stroke="hsl(30 100% 60%)" fill="url(#aiPredicted2)" strokeWidth={2} strokeDasharray="6 3" name="Predicted" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Actual Demand</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 border-t-2 border-dashed border-saffron" /> AI Predicted</span>
              </div>
            </motion.div>

            {/* AI Analytics Row: Price Prediction + Sustainability + Voice */}
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Price Prediction Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-card rounded-xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground text-sm">Price Prediction</h3>
                </div>
                {pricePrediction.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : pricePrediction.data ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Current</span>
                      <span className="text-lg font-heading font-bold text-foreground">₹{pricePrediction.data.current_price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Predicted</span>
                      <div className="flex items-center gap-1.5">
                        {pricePrediction.data.trend === "up" ? (
                          <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                        ) : pricePrediction.data.trend === "down" ? (
                          <TrendingDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className={`text-lg font-heading font-bold ${
                          pricePrediction.data.trend === "down" ? "text-primary" : pricePrediction.data.trend === "up" ? "text-destructive" : "text-foreground"
                        }`}>₹{pricePrediction.data.predicted_price}</span>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${
                        pricePrediction.data.trend === "down" ? "bg-primary" : pricePrediction.data.trend === "up" ? "bg-destructive" : "bg-muted-foreground"
                      }`} style={{ width: `${Math.min(100, Math.abs(pricePrediction.data.change_percent) * 10 + 30)}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-medium ${
                        pricePrediction.data.change_percent > 0 ? "text-destructive" : "text-primary"
                      }`}>
                        {pricePrediction.data.change_percent > 0 ? "+" : ""}{pricePrediction.data.change_percent.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground capitalize">
                        Confidence: {pricePrediction.data.confidence}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{pricePrediction.data.reasoning}</p>
                    {pricePrediction.data.best_time_to_buy && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                        <p className="text-[10px] text-primary font-medium">Best time to buy: {pricePrediction.data.best_time_to_buy}</p>
                      </div>
                    )}
                    <button
                      onClick={() => pricePrediction.mutate({ energy_type: "solar", current_price: 5.5 })}
                      disabled={pricePrediction.isPending}
                      className="w-full py-2 rounded-lg text-[10px] font-medium bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
                    >
                      Refresh Prediction
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No prediction data available</p>
                )}
              </motion.div>

              {/* Sustainability Score Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className="bg-card rounded-xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-3.5 h-3.5 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground text-sm">Sustainability Score</h3>
                </div>
                {sustainabilityMutation.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : sustainabilityMutation.data ? (
                  <div className="space-y-3">
                    {/* Score ring */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                          <motion.circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                            strokeLinecap="round" strokeDasharray={251}
                            initial={{ strokeDashoffset: 251 }}
                            animate={{ strokeDashoffset: 251 * (1 - sustainabilityMutation.data.overall_score / 100) }}
                            transition={{ duration: 1.2 }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-heading font-bold text-foreground">{sustainabilityMutation.data.overall_score}</span>
                          <span className="text-[8px] text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-medium text-foreground">{sustainabilityMutation.data.ranking}</p>
                        <p className="text-[10px] text-muted-foreground">{sustainabilityMutation.data.green_percentage}% green energy</p>
                        <p className="text-[10px] text-primary font-medium">{sustainabilityMutation.data.carbon_saved_kg.toFixed(0)}kg CO₂ saved</p>
                        <p className="text-[10px] text-muted-foreground">≈ {sustainabilityMutation.data.tree_equivalent} trees</p>
                      </div>
                    </div>
                    {/* Tips */}
                    <div className="space-y-1.5">
                      {sustainabilityMutation.data.improvement_tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                          <Sparkles className="w-2.5 h-2.5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Loading sustainability data...</p>
                )}
              </motion.div>

              {/* Voice TTS Panel */}
              <AIVoicePanel />
            </div>
          </div>
          {/* Floating AI Chat Panel */}
          <AIChatPanel userId="user-1" />
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default AIBrain;

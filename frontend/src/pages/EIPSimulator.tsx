import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Zap, Activity, AlertTriangle, Shield, Sun, Wind, Droplets, Factory, Building2, Heart, Cpu, ToggleLeft, ToggleRight, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

/* ── Simulated network nodes ─────────────────────── */
const nodeData = [
  { id: "solar1", label: "Solar Farm A", type: "source", icon: Sun, x: 8, y: 22, color: "hsl(30 100% 60%)" },
  { id: "wind1", label: "Wind Plant", type: "source", icon: Wind, x: 12, y: 62, color: "hsl(217 91% 60%)" },
  { id: "hydro1", label: "Hydro Station", type: "source", icon: Droplets, x: 8, y: 85, color: "hsl(192 82% 50%)" },
  { id: "solar2", label: "Solar Farm B", type: "source", icon: Sun, x: 35, y: 10, color: "hsl(30 100% 60%)" },
  { id: "hub1", label: "Grid Hub α", type: "hub", icon: Cpu, x: 38, y: 45, color: "hsl(142 72% 40%)" },
  { id: "hub2", label: "Grid Hub β", type: "hub", icon: Cpu, x: 62, y: 35, color: "hsl(142 72% 40%)" },
  { id: "home1", label: "Residential", type: "consumer", icon: Building2, x: 78, y: 18, color: "hsl(215 16% 47%)" },
  { id: "factory1", label: "Industrial", type: "consumer", icon: Factory, x: 85, y: 50, color: "hsl(215 16% 47%)" },
  { id: "hospital1", label: "Hospital", type: "consumer", icon: Heart, x: 75, y: 75, color: "hsl(0 84% 60%)" },
  { id: "city1", label: "City Center", type: "consumer", icon: Building2, x: 90, y: 85, color: "hsl(215 16% 47%)" },
];

const connections = [
  ["solar1", "hub1"], ["solar2", "hub1"], ["wind1", "hub1"], ["hydro1", "hub1"],
  ["hub1", "hub2"], ["hub2", "home1"], ["hub2", "factory1"], ["hub1", "hospital1"],
  ["hub2", "city1"], ["hub1", "city1"],
];

const aiCommentary = [
  { text: "AI detected surplus solar in Zone 2 — rerouting 2.4 kWh to industrial sector", time: "2s ago", type: "reroute" },
  { text: "Wind supply diverted to hospital grid for critical reliability", time: "5s ago", type: "priority" },
  { text: "Grid operating at 87% renewable efficiency — fossil fallback minimized", time: "8s ago", type: "status" },
  { text: "Demand spike predicted in 30 min — pre-charging battery reserves", time: "12s ago", type: "prediction" },
  { text: "Solar Farm A output increased 12% — clear sky conditions detected", time: "18s ago", type: "status" },
  { text: "Emergency reroute complete: Hospital grid now 100% renewable backed", time: "25s ago", type: "reroute" },
  { text: "Carbon saved via smart routing: 340 kg in last hour", time: "30s ago", type: "status" },
  { text: "Cross-state energy transfer: Gujarat solar → Mumbai demand fulfilled", time: "35s ago", type: "reroute" },
];

const commentaryColors: Record<string, string> = {
  reroute: "border-l-primary bg-primary/5",
  priority: "border-l-destructive bg-destructive/5",
  status: "border-l-accent bg-accent/5",
  prediction: "border-l-saffron bg-saffron/5",
};

const stabilityHistory = [
  { t: "0s", stability: 94, renewable: 87 }, { t: "5s", stability: 93, renewable: 86 },
  { t: "10s", stability: 95, renewable: 88 }, { t: "15s", stability: 92, renewable: 85 },
  { t: "20s", stability: 96, renewable: 89 }, { t: "25s", stability: 94, renewable: 87 },
  { t: "30s", stability: 95, renewable: 90 }, { t: "35s", stability: 93, renewable: 88 },
];

/* ── Animated Particle on SVG path ────────────────── */
const FlowParticle = ({ x1, y1, x2, y2, delay, stress, color }: { x1: number; y1: number; x2: number; y2: number; delay: number; stress: boolean; color: string }) => (
  <motion.circle
    r={stress ? 3 : 2.5}
    fill={color}
    filter={`drop-shadow(0 0 ${stress ? 4 : 2}px ${color})`}
    initial={{ cx: x1, cy: y1, opacity: 0 }}
    animate={{
      cx: [x1, (x1 + x2) / 2, x2],
      cy: [y1, (y1 + y2) / 2, y2],
      opacity: [0, 1, 0],
    }}
    transition={{ duration: stress ? 1.2 : 2.4, delay, repeat: Infinity, ease: "linear" }}
  />
);

/* ── Node Component ──────────────────────────────── */
const NetworkNode = ({ node, isOutage, demand }: { node: typeof nodeData[0]; isOutage: boolean; demand: number }) => {
  const isStressed = node.type === "consumer" && demand > 70;
  const isDown = isOutage && node.id === "factory1";
  const Icon = node.icon;

  return (
    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
      {/* Glow ring */}
      <circle cx={node.x} cy={node.y} r={isDown ? 5.5 : 4.5}
        fill="none" stroke={isDown ? "hsl(0 84% 60%)" : node.color} strokeWidth={0.5}
        opacity={0.3}>
        <animate attributeName="r" values={isDown ? "5;7;5" : "4;5.5;4"} dur={isDown ? "0.8s" : "2s"} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur={isDown ? "0.8s" : "2s"} repeatCount="indefinite" />
      </circle>
      {/* Core */}
      <circle cx={node.x} cy={node.y} r={node.type === "hub" ? 4 : 3.2}
        fill={isDown ? "hsl(0 84% 20%)" : `${node.color.replace(")", " / 0.15)")}` }
        stroke={isDown ? "hsl(0 84% 60%)" : node.color} strokeWidth={0.8} />
      {/* Label */}
      <text x={node.x} y={node.y + (node.y > 70 ? -5.5 : 6.5)}
        textAnchor="middle" fill={isDown ? "hsl(0 84% 60%)" : "hsl(215 16% 60%)"}
        fontSize={2.2} fontWeight={600} fontFamily="Space Grotesk, sans-serif">
        {node.label}
      </text>
    </motion.g>
  );
};

/* ── Main Page ───────────────────────────────────── */
const EIPSimulator = () => {
  const [demand, setDemand] = useState(45);
  const [supply, setSupply] = useState(65);
  const [aiBalance, setAiBalance] = useState(true);
  const [outageActive, setOutageActive] = useState(false);
  const [view, setView] = useState<"city" | "national">("city");
  const [commentaryIdx, setCommentaryIdx] = useState(0);

  // Rotate commentary
  useEffect(() => {
    const interval = setInterval(() => setCommentaryIdx(p => (p + 1) % aiCommentary.length), 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-stabilize outage
  useEffect(() => {
    if (outageActive) {
      const timer = setTimeout(() => setOutageActive(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [outageActive]);

  const efficiency = useMemo(() => {
    const base = Math.round(75 + supply * 0.25 - demand * 0.15);
    return outageActive ? Math.max(60, base - 18) : Math.min(99, aiBalance ? base + 5 : base);
  }, [demand, supply, aiBalance, outageActive]);

  const packetRate = useMemo(() => {
    const base = Math.round(8000 + supply * 80 + demand * 40);
    return outageActive ? Math.round(base * 0.6) : base;
  }, [demand, supply, outageActive]);

  const carbonSaved = useMemo(() => Math.round(supply * 5.2 + (aiBalance ? 340 : 0)), [supply, aiBalance]);

  const visibleCommentary = useMemo(() => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push(aiCommentary[(commentaryIdx + i) % aiCommentary.length]);
    }
    return items;
  }, [commentaryIdx]);

  const getLineColor = (fromId: string, toId: string) => {
    if (outageActive && toId === "factory1") return "hsl(0 84% 60%)";
    const fromNode = nodeData.find(n => n.id === fromId);
    if (fromNode?.type === "source") return fromNode.color;
    return "hsl(142 72% 40%)";
  };

  const nationalRoutes = [
    { from: "Gujarat Solar", to: "Mumbai", fromPos: [20, 55], toPos: [35, 62] },
    { from: "Rajasthan Wind", to: "Delhi", fromPos: [28, 35], toPos: [38, 28] },
    { from: "Tamil Nadu Wind", to: "Bangalore", fromPos: [55, 82], toPos: [48, 72] },
    { from: "Kerala Hydro", to: "Chennai", fromPos: [48, 90], toPos: [60, 80] },
    { from: "MP Solar", to: "Pune", fromPos: [42, 48], toPos: [38, 58] },
  ];

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative">
          <FloatingOrbs />
          <div className="max-w-[1200px] mx-auto space-y-6 relative z-10">

            {/* ── Hero Banner ─────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-8 lg:p-10">
              <div className="absolute inset-0 animate-energy-flow" style={{
                backgroundSize: "200% 200%",
                background: "linear-gradient(135deg, hsl(142 72% 28% / 0.9), hsl(217 91% 40% / 0.85), hsl(192 82% 40% / 0.7), hsl(30 100% 50% / 0.4))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Globe className="w-3 h-3 text-white animate-pulse" />
                    <span className="text-white font-medium">Protocol Active</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Decentralized Energy Internet Simulator
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Watch how renewable energy flows, reroutes, and powers cities intelligently.
                  </p>
                </div>
                <div className="flex gap-4">
                  {[
                    { label: "Packets/sec", value: packetRate.toLocaleString(), icon: Activity },
                    { label: "Grid Efficiency", value: `${efficiency}%`, icon: Shield },
                    { label: "CO₂ Saved", value: `${carbonSaved} kg`, icon: Zap },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <s.icon className="w-4 h-4 text-white/60 mx-auto mb-1" />
                      <motion.p key={s.value} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="text-lg font-heading font-bold text-white">{s.value}</motion.p>
                      <p className="text-[9px] text-white/50">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Main Grid: Sim + Controls ──────────── */}
            <div className="grid lg:grid-cols-4 gap-6">

              {/* AI Commentary Feed (left) */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-5 border border-border lg:col-span-1 max-h-[520px] overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground text-sm">AI Feed</h3>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-primary font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {visibleCommentary.map((c, i) => (
                      <motion.div key={`${commentaryIdx}-${i}`}
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        transition={{ delay: i * 0.05 }}
                        className={`rounded-lg p-3 border-l-[3px] text-[11px] leading-relaxed text-foreground ${commentaryColors[c.type]}`}>
                        {c.text}
                        <p className="text-[9px] text-muted-foreground mt-1">{c.time}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Network Visualization (center) */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden relative">

                {/* View toggle */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    {view === "city" ? "Live Energy Network" : "National Grid View"}
                  </h3>
                  <div className="flex gap-1">
                    {(["city", "national"] as const).map(v => (
                      <button key={v} onClick={() => setView(v)}
                        className={`px-3 py-1 rounded-full text-[10px] font-medium capitalize transition-all ${
                          view === v ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}>{v === "city" ? "City View" : "National"}</button>
                    ))}
                  </div>
                </div>

                {/* SVG Network */}
                <div className="relative px-2 pb-2">
                  <svg viewBox="0 0 100 100" className="w-full aspect-[4/3]" style={{ background: "transparent" }}>
                    {/* Background grid */}
                    <defs>
                      <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(215 16% 47%)" strokeWidth="0.08" opacity="0.3" />
                      </pattern>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="0.8" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <rect width="100" height="100" fill="url(#gridPattern)" />

                    {view === "city" ? (
                      <>
                        {/* Connection lines */}
                        {connections.map(([fromId, toId], i) => {
                          const from = nodeData.find(n => n.id === fromId)!;
                          const to = nodeData.find(n => n.id === toId)!;
                          const lineColor = getLineColor(fromId, toId);
                          const isStressed = demand > 70 && to.type === "consumer";
                          const isOutageLink = outageActive && toId === "factory1";

                          return (
                            <g key={`${fromId}-${toId}`}>
                              {/* Line */}
                              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                stroke={lineColor} strokeWidth={isOutageLink ? 0.6 : 0.4}
                                opacity={isOutageLink ? 0.3 : 0.5}
                                strokeDasharray={isOutageLink ? "1 1" : undefined} />
                              {/* Particles */}
                              {!isOutageLink && (
                                <>
                                  <FlowParticle x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                    delay={i * 0.3} stress={isStressed} color={lineColor} />
                                  <FlowParticle x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                    delay={i * 0.3 + 1.2} stress={isStressed} color={lineColor} />
                                </>
                              )}
                            </g>
                          );
                        })}

                        {/* AI reroute line (appears when outage + AI enabled) */}
                        {outageActive && aiBalance && (
                          <motion.line
                            x1={nodeData.find(n => n.id === "hub2")!.x}
                            y1={nodeData.find(n => n.id === "hub2")!.y}
                            x2={nodeData.find(n => n.id === "factory1")!.x}
                            y2={nodeData.find(n => n.id === "factory1")!.y}
                            stroke="hsl(142 72% 50%)" strokeWidth={0.8}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: [0, 1, 0.7] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            filter="url(#glow)"
                          />
                        )}

                        {/* Nodes */}
                        {nodeData.map(node => (
                          <NetworkNode key={node.id} node={node} isOutage={outageActive} demand={demand} />
                        ))}
                      </>
                    ) : (
                      /* National View */
                      <>
                        {/* India outline (simplified) */}
                        <ellipse cx="45" cy="55" rx="30" ry="38" fill="none" stroke="hsl(215 16% 47%)" strokeWidth="0.3" opacity="0.2" />

                        {nationalRoutes.map((route, i) => (
                          <g key={route.from}>
                            <line x1={route.fromPos[0]} y1={route.fromPos[1]} x2={route.toPos[0]} y2={route.toPos[1]}
                              stroke="hsl(142 72% 40%)" strokeWidth="0.4" opacity="0.5" />
                            <FlowParticle x1={route.fromPos[0]} y1={route.fromPos[1]} x2={route.toPos[0]} y2={route.toPos[1]}
                              delay={i * 0.5} stress={false} color="hsl(142 72% 50%)" />
                            <FlowParticle x1={route.fromPos[0]} y1={route.fromPos[1]} x2={route.toPos[0]} y2={route.toPos[1]}
                              delay={i * 0.5 + 1} stress={false} color="hsl(30 100% 60%)" />
                            {/* Source label */}
                            <circle cx={route.fromPos[0]} cy={route.fromPos[1]} r="2.5" fill="hsl(30 100% 60% / 0.15)" stroke="hsl(30 100% 60%)" strokeWidth="0.6" />
                            <text x={route.fromPos[0]} y={route.fromPos[1] - 4} textAnchor="middle" fill="hsl(30 100% 60%)"
                              fontSize="2" fontWeight="600" fontFamily="Space Grotesk">{route.from}</text>
                            {/* Dest label */}
                            <circle cx={route.toPos[0]} cy={route.toPos[1]} r="2.5" fill="hsl(217 91% 60% / 0.15)" stroke="hsl(217 91% 60%)" strokeWidth="0.6" />
                            <text x={route.toPos[0]} y={route.toPos[1] - 4} textAnchor="middle" fill="hsl(217 91% 60%)"
                              fontSize="2" fontWeight="600" fontFamily="Space Grotesk">{route.to}</text>
                          </g>
                        ))}
                      </>
                    )}
                  </svg>

                  {/* Outage overlay message */}
                  <AnimatePresence>
                    {outageActive && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-semibold flex items-center gap-2 shadow-lg">
                        <AlertTriangle className="w-3 h-3" />
                        {aiBalance ? "AI rerouting energy — stabilizing grid..." : "OUTAGE DETECTED — Industrial Zone"}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Control Panel (right) */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                className="bg-card rounded-xl p-5 border border-border space-y-5">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm mb-1">Simulation Controls</h3>
                  <p className="text-[10px] text-muted-foreground">Adjust parameters to stress-test the grid</p>
                </div>

                {/* Demand Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">City Demand</span>
                    <span className={`text-xs font-bold ${demand > 70 ? "text-saffron" : "text-primary"}`}>{demand}%</span>
                  </div>
                  <input type="range" min={10} max={95} value={demand} onChange={e => setDemand(+e.target.value)}
                    className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                  {demand > 70 && <p className="text-[10px] text-saffron mt-1 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> High demand stress</p>}
                </div>

                {/* Supply Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">Renewable Supply</span>
                    <span className="text-xs font-bold text-primary">{supply}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={supply} onChange={e => setSupply(+e.target.value)}
                    className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md" />
                </div>

                {/* AI Toggle */}
                <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">AI Auto-Balance</p>
                    <p className="text-[10px] text-muted-foreground">Smart rerouting engine</p>
                  </div>
                  <button onClick={() => setAiBalance(!aiBalance)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${aiBalance ? "bg-primary" : "bg-muted"}`}>
                    <motion.div animate={{ x: aiBalance ? 20 : 2 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
                {aiBalance && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[10px] text-primary flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> AI rerouted 3.2 kWh to prevent outage
                  </motion.p>
                )}

                {/* Emergency Button */}
                <button onClick={() => setOutageActive(true)} disabled={outageActive}
                  className={`w-full py-3 rounded-xl text-xs font-semibold transition-all ${
                    outageActive
                      ? "bg-destructive/20 text-destructive border border-destructive/30 cursor-not-allowed"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl"
                  }`}>
                  <span className="flex items-center justify-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {outageActive ? "Stabilizing..." : "Simulate Power Outage"}
                  </span>
                </button>
                {outageActive && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                    <p className="text-[10px] text-primary font-medium text-center">
                      ✓ Grid stabilized using decentralized renewable routing
                    </p>
                  </motion.div>
                )}

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {[
                    { label: "Stability", value: `${efficiency}%`, color: efficiency > 85 ? "text-primary" : "text-saffron" },
                    { label: "Latency", value: `${Math.round(12 + demand * 0.3)}ms`, color: "text-accent" },
                    { label: "Renewable %", value: `${Math.min(99, supply)}%`, color: "text-primary" },
                    { label: "CO₂ Saved", value: `${carbonSaved}kg`, color: "text-saffron" },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-muted/30 p-2 text-center">
                      <motion.p key={s.value} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className={`text-sm font-heading font-bold ${s.color}`}>{s.value}</motion.p>
                      <p className="text-[9px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Grid Intelligence Panel ────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-5">Grid Intelligence Analytics</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={stabilityHistory}>
                  <defs>
                    <linearGradient id="stabGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="renGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                  <Area type="monotone" dataKey="stability" stroke="hsl(142 72% 40%)" fill="url(#stabGrad)" strokeWidth={2.5} name="Grid Stability %" />
                  <Area type="monotone" dataKey="renewable" stroke="hsl(217 91% 60%)" fill="url(#renGrad)" strokeWidth={2} name="Renewable %" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Grid Stability</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Renewable Routing</span>
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default EIPSimulator;

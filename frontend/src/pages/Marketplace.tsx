import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sun, Wind, Droplets, MapPin, Leaf, Shield, Star, Brain, Zap, SlidersHorizontal, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";

const energyListings = [
  { id: 1, producer: "SolarFarm Alpha", type: "Solar", icon: Sun, price: 5.8, distance: 2.4, carbon: 120, reliability: 98, badge: "Top Rated", availability: 92 },
  { id: 2, producer: "WindTech Pune", type: "Wind", icon: Wind, price: 6.2, distance: 5.1, carbon: 95, reliability: 94, badge: "AI Pick", availability: 88 },
  { id: 3, producer: "HydroFlow Kerala", type: "Hydro", icon: Droplets, price: 4.9, distance: 12.3, carbon: 150, reliability: 99, badge: "Best Price", availability: 97 },
  { id: 4, producer: "SolarMax Delhi", type: "Solar", icon: Sun, price: 6.5, distance: 1.8, carbon: 110, reliability: 96, badge: null, availability: 85 },
  { id: 5, producer: "GreenWind TN", type: "Wind", icon: Wind, price: 5.5, distance: 8.7, carbon: 130, reliability: 92, badge: null, availability: 79 },
  { id: 6, producer: "MicroSolar Goa", type: "Solar", icon: Sun, price: 7.1, distance: 3.2, carbon: 88, reliability: 97, badge: "Nearest", availability: 91 },
];

const filters = ["All", "Solar", "Wind", "Hydro"];

const badgeColors: Record<string, string> = {
  "Top Rated": "bg-saffron/10 text-saffron border-saffron/20",
  "AI Pick": "bg-accent/10 text-accent border-accent/20",
  "Best Price": "bg-primary/10 text-primary border-primary/20",
  "Nearest": "bg-primary/10 text-primary border-primary/20",
};

const Marketplace = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? energyListings
    : energyListings.filter((e) => e.type === activeFilter);

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
                background: "linear-gradient(135deg, hsl(217 91% 45% / 0.9), hsl(142 72% 35% / 0.75), hsl(217 91% 55% / 0.65), hsl(30 100% 55% / 0.45))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-white font-medium">AI-Powered Matching</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                  Buy & Sell Renewable Energy
                </h1>
                <p className="text-sm text-white/70 max-w-lg">
                  Browse verified clean energy sources from producers near you. AI recommends the best options for your needs.
                </p>
              </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl p-4 flex flex-wrap items-center gap-4 border border-border"
            >
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1.5">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      activeFilter === f
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-1.5 text-xs text-muted-foreground">
                <span className="px-3 py-1.5 rounded-full bg-muted/50 cursor-pointer hover:text-foreground hover:bg-muted transition-colors">Best Price</span>
                <span className="px-3 py-1.5 rounded-full bg-muted/50 cursor-pointer hover:text-foreground hover:bg-muted transition-colors">Nearest</span>
                <span className="px-3 py-1.5 rounded-full bg-muted/50 cursor-pointer hover:text-foreground hover:bg-muted transition-colors">Greenest</span>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Cards Grid */}
              <div className="lg:col-span-3 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group relative bg-card rounded-xl p-6 border border-border transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
                  >
                    {/* Gradient top edge */}
                    <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-primary/30 via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {item.badge && (
                      <span className={`absolute top-4 right-4 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeColors[item.badge] || "bg-primary/10 text-primary border-primary/20"}`}>
                        {item.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/10 transition-all">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-heading font-semibold text-sm text-foreground">{item.producer}</h4>
                        <span className="text-xs text-muted-foreground">{item.type} Energy</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-[10px] text-muted-foreground">Price</p>
                        <p className="font-heading font-bold text-primary text-lg">₹{item.price}</p>
                        <p className="text-[10px] text-muted-foreground">/kWh</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-[10px] text-muted-foreground">Distance</p>
                        <p className="font-heading font-bold text-foreground text-lg">{item.distance}</p>
                        <p className="text-[10px] text-muted-foreground">km away</p>
                      </div>
                    </div>

                    {/* Availability bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Availability</span>
                        <span className="text-[10px] font-semibold text-foreground">{item.availability}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.availability}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-5">
                      <span className="flex items-center gap-1"><Leaf className="w-3 h-3 text-primary" />{item.carbon}kg CO₂</span>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{item.reliability}%</span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="flex-1 text-xs transition-all duration-200 group-hover:shadow-md group-hover:shadow-primary/15">Buy Energy</Button>
                      <Button variant="outline" size="sm" className="text-xs">Details</Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Recommendation Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden bg-card rounded-xl p-6 border border-border h-fit sticky top-[80px]"
              >
                {/* Glow behind panel */}
                <div className="absolute -top-10 -right-10 w-40 h-40 opacity-[0.06] blur-[60px] rounded-full" style={{ background: "hsl(142 72% 40%)" }} />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glossy">
                      <Brain className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-sm text-foreground">AI Picks</h3>
                      <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Smart Match
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Best Price</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">HydroFlow Kerala</p>
                      <p className="text-xs text-muted-foreground">₹4.9/kWh • 12.3 km</p>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Nearest</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">SolarMax Delhi</p>
                      <p className="text-xs text-muted-foreground">₹6.5/kWh • 1.8 km</p>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Max Carbon Save</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">HydroFlow Kerala</p>
                      <p className="text-xs text-muted-foreground">150 kg CO₂ saved/month</p>
                    </div>

                    {/* Score card */}
                    <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                      <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Best Match Score</p>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-heading font-bold text-primary">94</span>
                        <span className="text-sm text-muted-foreground mb-1">%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "94%" }}
                          transition={{ delay: 1, duration: 1.2 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        />
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= 4 ? "text-saffron fill-saffron" : "text-muted"}`} />
                        ))}
                      </div>
                    </div>
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

export default Marketplace;

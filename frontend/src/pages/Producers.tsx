import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sun, Wind, Droplets, MapPin, Shield, Star, Zap, Users, TrendingUp, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

const producers = [
  { id: 1, name: "SolarFarm Alpha", type: "Solar", icon: Sun, location: "Rajasthan", capacity: "5.2 MW", available: "3,200 kWh", rating: 4.9, verified: true, reliability: 98, totalSold: 124000, activeContracts: 42 },
  { id: 2, name: "WindTech Pune", type: "Wind", icon: Wind, location: "Maharashtra", capacity: "8.5 MW", available: "6,100 kWh", rating: 4.7, verified: true, reliability: 94, totalSold: 89000, activeContracts: 28 },
  { id: 3, name: "HydroFlow Kerala", type: "Hydro", icon: Droplets, location: "Kerala", capacity: "12.0 MW", available: "9,800 kWh", rating: 4.8, verified: true, reliability: 99, totalSold: 210000, activeContracts: 65 },
  { id: 4, name: "SolarMax Delhi", type: "Solar", icon: Sun, location: "Delhi NCR", capacity: "3.8 MW", available: "2,100 kWh", rating: 4.5, verified: true, reliability: 96, totalSold: 56000, activeContracts: 18 },
  { id: 5, name: "GreenWind TN", type: "Wind", icon: Wind, location: "Tamil Nadu", capacity: "6.2 MW", available: "4,500 kWh", rating: 4.6, verified: true, reliability: 92, totalSold: 72000, activeContracts: 24 },
  { id: 6, name: "MicroSolar Goa", type: "Solar", icon: Sun, location: "Goa", capacity: "1.5 MW", available: "980 kWh", rating: 4.8, verified: false, reliability: 97, totalSold: 28000, activeContracts: 12 },
  { id: 7, name: "Tidal Energy Mumbai", type: "Tidal", icon: Droplets, location: "Mumbai", capacity: "4.0 MW", available: "2,800 kWh", rating: 4.4, verified: true, reliability: 91, totalSold: 45000, activeContracts: 15 },
  { id: 8, name: "GeoTherm Karnataka", type: "Geo", icon: Zap, location: "Karnataka", capacity: "2.5 MW", available: "1,900 kWh", rating: 4.7, verified: true, reliability: 98, totalSold: 38000, activeContracts: 14 },
];

const filters = ["All", "Solar", "Wind", "Hydro", "Geo", "Tidal"];

const Producers = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? producers
    : producers.filter((p) => p.type === activeFilter);

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
                background: "linear-gradient(135deg, hsl(217 91% 45% / 0.9), hsl(142 72% 35% / 0.75), hsl(30 100% 55% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Users className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Verified Producers</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Renewable Energy Producers
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Browse verified clean energy producers. View capacity, ratings, and performance stats.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={847} suffix="+" />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Active Producers</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={42} suffix=" MW" />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Total Capacity</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl p-4 flex flex-wrap items-center gap-4 border border-border"
            >
              <Users className="w-4 h-4 text-muted-foreground" />
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
              <div className="ml-auto text-xs text-muted-foreground">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">{filtered.length} Producers</span>
              </div>
            </motion.div>

            {/* Producer Cards Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((producer, i) => (
                <motion.div
                  key={producer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative bg-card rounded-xl p-6 border border-border transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
                >
                  <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-primary/30 via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {producer.verified && (
                    <span className="absolute top-4 right-4 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/10 transition-all">
                      <producer.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-foreground">{producer.name}</h4>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {producer.location}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">Capacity</p>
                      <p className="font-heading font-bold text-foreground text-lg">{producer.capacity}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">Available</p>
                      <p className="font-heading font-bold text-primary text-lg">{producer.available}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-saffron fill-saffron" />
                      <span className="font-semibold text-foreground">{producer.rating}</span>
                    </span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{producer.reliability}% reliable</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                    <div className="rounded-lg bg-muted/20 p-2">
                      <p className="text-[10px] text-muted-foreground">Total Sold</p>
                      <p className="text-xs font-semibold text-foreground">{producer.totalSold.toLocaleString()} kWh</p>
                    </div>
                    <div className="rounded-lg bg-muted/20 p-2">
                      <p className="text-[10px] text-muted-foreground">Contracts</p>
                      <p className="text-xs font-semibold text-foreground">{producer.activeContracts} active</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="default" size="sm" className="flex-1 text-xs transition-all duration-200 group-hover:shadow-md group-hover:shadow-primary/15">
                      <ExternalLink className="w-3 h-3 mr-1" /> View Profile
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">Buy Energy</Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats Strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-xl p-5 border border-border"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground"><AnimatedCounter end={847} /></p>
                  <p className="text-xs text-muted-foreground">Verified Producers</p>
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-primary"><AnimatedCounter end={42} suffix=" MW" /></p>
                  <p className="text-xs text-muted-foreground">Total Capacity</p>
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground"><AnimatedCounter end={1240000} /></p>
                  <p className="text-xs text-muted-foreground">kWh Traded</p>
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-primary"><AnimatedCounter end={98} suffix="%" /></p>
                  <p className="text-xs text-muted-foreground">Avg Reliability</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Producers;

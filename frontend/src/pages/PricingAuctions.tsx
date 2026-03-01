import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LoadingSpinner, ErrorCard } from "@/components/ui/ApiStates";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Gavel, Clock, Plus, Zap, Activity } from "lucide-react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { pricingService } from "@/services/pricingService";
import { useListings } from "@/hooks/useListings";
import { usePricingStream } from "@/hooks/usePricingStream";
import { EnergySource } from "@/types";

const PricingAuctions = () => {
  const [bidAmount, setBidAmount] = useState<string>("");

  const { data: spotPrices, isLoading: spotLoading } = useQuery({
    queryKey: ["pricing", "spot", "all"],
    queryFn: () => pricingService.getAllSpotPrices(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // Real-time WebSocket pricing — overrides REST when connected
  const { prices: wsPrices, isConnected: wsConnected } = usePricingStream();
  const livePrices = wsConnected && wsPrices.length > 0 ? wsPrices : spotPrices;

  const { data: historicalData, isLoading: histLoading } = useQuery({
    queryKey: ["pricing", "historical", "solar"],
    queryFn: () => pricingService.getHistoricalPrices(EnergySource.SOLAR, 12, 60),
    staleTime: 60_000,
  });

  const { data: listingsRes } = useListings({ status: "active" as any, limit: 10 });

  const currentPrice = livePrices?.[0]?.price_per_kwh ?? 7.2;

  const spotPriceData = useMemo(() => {
    if (!historicalData?.data?.length) {
      return [
        { time: "6AM", price: 5.2 }, { time: "8AM", price: 5.8 },
        { time: "10AM", price: 6.4 }, { time: "12PM", price: 6.5 },
        { time: "2PM", price: 6.9 }, { time: "4PM", price: 7.4 },
        { time: "6PM", price: 8.2 }, { time: "Now", price: currentPrice },
      ];
    }
    return historicalData.data.map((point, idx) => ({
      time: new Date(point.timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
      price: point.price_per_kwh,
    }));
  }, [historicalData, currentPrice]);

  const volatilityData = useMemo(() => {
    if (!historicalData?.data?.length) {
      return [
        { hour: "6AM", volatility: 2.1 }, { hour: "8AM", volatility: 4.2 },
        { hour: "10AM", volatility: 3.8 }, { hour: "12PM", volatility: 5.1 },
        { hour: "2PM", volatility: 4.6 }, { hour: "4PM", volatility: 6.2 },
        { hour: "6PM", volatility: 7.8 }, { hour: "8PM", volatility: 5.4 },
      ];
    }
    // Compute volatility as abs difference between consecutive points
    return historicalData.data.slice(1).map((point, idx) => ({
      hour: new Date(point.timestamp).toLocaleTimeString("en-IN", { hour: "numeric" }),
      volatility: parseFloat(Math.abs(point.price_per_kwh - historicalData.data[idx].price_per_kwh).toFixed(2)),
    }));
  }, [historicalData]);

  const activeAuctions = useMemo(() => {
    if (!listingsRes?.items) return [];
    return listingsRes.items.slice(0, 5).map((l, idx) => ({
      id: `AUC-${String(idx + 1).padStart(3, "0")}`,
      producer: l.title || `Producer ${l.producer_id?.slice(-4)}`,
      type: (l.energy_source?.charAt(0).toUpperCase() + l.energy_source?.slice(1)) || "Solar",
      volume: l.quantity_kwh,
      currentBid: l.price_per_kwh,
      bids: (idx * 3 + 5) % 15 + 3,
      endsIn: `${(idx % 6) + 1}h ${(idx * 17) % 59}m`,
      status: idx === 2 ? "ending" : "live",
    }));
  }, [listingsRes]);

  if (spotLoading && histLoading) {
    return <AppLayout><PageTransition><LoadingSpinner message="Loading pricing data..." /></PageTransition></AppLayout>;
  }

  // Note: spotPrices/historicalData queries don't expose error in a combined way;
  // individual errors are handled by React Query's global error handler.

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
                background: "linear-gradient(135deg, hsl(30 100% 50% / 0.9), hsl(142 72% 35% / 0.75), hsl(217 91% 55% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <DollarSign className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Pricing Engine</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Pricing & Auctions
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Real-time spot prices, volatility insights, and live energy auctions.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">₹{currentPrice}</p>
                    <p className="text-[11px] text-white/60 mt-1">Spot Price/kWh</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15">
                    <TrendingUp className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold">+12.5%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { label: "Current Price", value: `₹${currentPrice}`, sub: "/kWh", icon: DollarSign, change: "+12.5%", up: true, gradient: "from-primary/20 to-primary/5" },
                { label: "24h High", value: "₹8.2", sub: "/kWh", icon: TrendingUp, change: "6PM", up: true, gradient: "from-saffron/20 to-saffron/5" },
                { label: "24h Low", value: "₹5.2", sub: "/kWh", icon: TrendingDown, change: "6AM", up: false, gradient: "from-accent/20 to-accent/5" },
                { label: "24h Average", value: "₹6.6", sub: "/kWh", icon: Activity, change: "+8.2%", up: true, gradient: "from-primary/20 to-accent/5" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="group relative bg-card rounded-xl p-5 border border-border transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                      <stat.icon className="w-4 h-4 text-foreground" />
                    </div>
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${stat.up ? "text-primary" : "text-destructive"}`}>
                      {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-xl font-heading font-bold text-foreground">{stat.value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{stat.sub}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Price Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="lg:col-span-2 bg-card rounded-xl p-6 border border-border"
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Real-time Spot Price</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-heading font-bold text-foreground">₹{currentPrice}</span>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" /> +12.5% today
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <Activity className="w-3 h-3 text-primary animate-pulse" />
                    <span className="text-[11px] text-primary font-semibold">LIVE</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={spotPriceData}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[4, 9]} tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="price" stroke="hsl(142 72% 40%)" fill="url(#priceGrad)" strokeWidth={2.5} name="Price (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Volatility */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <h3 className="font-heading font-semibold text-foreground mb-4">Hourly Volatility</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={volatilityData}>
                    <XAxis dataKey="hour" tick={{ fill: "hsl(215 16% 47%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="volatility" fill="hsl(30 100% 55%)" radius={[4, 4, 0, 0]} name="Volatility %" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Peak volatility at 6-8 PM
                </p>
              </motion.div>
            </div>

            {/* Active Auctions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-primary" /> Active Auctions
                </h3>
                <Button size="sm" className="text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Create Auction
                </Button>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {activeAuctions.map((auction, i) => (
                  <motion.div
                    key={auction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className={`rounded-xl p-5 border transition-all hover:shadow-lg ${
                      auction.status === "ending" ? "bg-saffron/5 border-saffron/30" : "bg-muted/20 border-border hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-muted-foreground">{auction.id}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        auction.status === "ending" ? "bg-saffron/20 text-saffron" : "bg-primary/10 text-primary"
                      }`}>
                        {auction.status === "ending" ? "ENDING SOON" : "LIVE"}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-foreground mb-1">{auction.producer}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{auction.type} • {auction.volume} kWh</p>

                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-muted-foreground">Current Bid</span>
                      <span className="font-heading font-bold text-primary text-lg">₹{auction.currentBid}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>{auction.bids} bids</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {auction.endsIn}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Your bid"
                        className="flex-1 h-8 px-3 text-xs rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                      <Button size="sm" className="h-8 text-xs">Bid</Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default PricingAuctions;

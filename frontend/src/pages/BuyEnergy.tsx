import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LoadingSpinner, ErrorCard } from "@/components/ui/ApiStates";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sun, Wind, Droplets, Zap, Calculator, ShoppingBag, Plus, Minus, FileText, CheckCircle, ArrowRight, Sparkles, LucideIcon } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useListings, useBuyEnergy } from "@/hooks/useListings";
import { useVoiceNotifications } from "@/hooks/useVoiceNotifications";

const sourceIcons: Record<string, { icon: LucideIcon; color: string }> = {
  solar: { icon: Sun, color: "from-saffron/20 to-saffron/5" },
  wind: { icon: Wind, color: "from-accent/20 to-accent/5" },
  hydro: { icon: Droplets, color: "from-primary/20 to-primary/5" },
};

const BuyEnergy = () => {
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [volume, setVolume] = useState(100);
  const [showContract, setShowContract] = useState(false);

  const { data: listingsRes, isLoading, error, refetch } = useListings({ status: "active" as any, limit: 20 });
  const { contractCreated } = useVoiceNotifications();

  const energyListings = useMemo(() => {
    if (!listingsRes?.items) return [];
    return listingsRes.items.map((l) => {
      const src = l.energy_source.toLowerCase();
      const info = sourceIcons[src] || sourceIcons.solar;
      return {
        id: l.id,
        producer: l.title || l.producer_id,
        type: l.energy_source.charAt(0).toUpperCase() + l.energy_source.slice(1),
        icon: info.icon,
        price: l.price_per_kwh,
        available: l.quantity_kwh,
        reliability: 96,
        color: info.color,
      };
    });
  }, [listingsRes]);

  const buyMutation = useBuyEnergy();

  // Voice notification on successful purchase
  useEffect(() => {
    if (buyMutation.isSuccess) {
      contractCreated();
    }
  }, [buyMutation.isSuccess, contractCreated]);

  const toggleSelection = (id: string) => {
    setSelectedListings(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedItems = energyListings.filter(l => selectedListings.includes(l.id));
  const avgPrice = selectedItems.length > 0 
    ? selectedItems.reduce((sum, l) => sum + l.price, 0) / selectedItems.length 
    : 0;
  const totalCost = avgPrice * volume;

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
                background: "linear-gradient(135deg, hsl(142 72% 35% / 0.9), hsl(217 91% 50% / 0.75), hsl(30 100% 55% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                  <ShoppingBag className="w-3 h-3 text-white" />
                  <span className="text-white font-medium">Quick Purchase</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                  Buy Renewable Energy
                </h1>
                <p className="text-sm text-white/70 max-w-lg">
                  Compare listings, calculate costs, and create purchase contracts in one streamlined flow.
                </p>
              </div>
            </motion.div>

            {isLoading && <LoadingSpinner />}
            {error && <ErrorCard message="Failed to load listings" onRetry={refetch} />}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Listings Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="lg:col-span-2 space-y-4"
              >
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Select Energy Sources (Compare Side-by-Side)
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {energyListings.map((listing, i) => {
                      const isSelected = selectedListings.includes(listing.id);
                      return (
                        <motion.div
                          key={listing.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.08 }}
                          onClick={() => toggleSelection(listing.id)}
                          className={`relative cursor-pointer rounded-xl p-5 border-2 transition-all duration-300 ${
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                              : "border-border bg-card hover:border-primary/30"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${listing.color} flex items-center justify-center mb-3`}>
                            <listing.icon className="w-5 h-5 text-foreground" />
                          </div>
                          <h4 className="font-heading font-semibold text-sm text-foreground">{listing.producer}</h4>
                          <p className="text-xs text-muted-foreground mb-3">{listing.type} Energy</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price</span>
                              <span className="font-bold text-primary">₹{listing.price}/kWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Available</span>
                              <span className="font-semibold text-foreground">{listing.available.toLocaleString()} kWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Reliability</span>
                              <span className="font-semibold text-foreground">{listing.reliability}%</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Volume Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" /> Volume & Price Calculator
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setVolume(Math.max(10, volume - 50))}
                        className="h-10 w-10"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="text-center min-w-[120px]">
                        <p className="text-3xl font-heading font-bold text-foreground">{volume}</p>
                        <p className="text-xs text-muted-foreground">kWh</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setVolume(volume + 50)}
                        className="h-10 w-10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={10}
                        max={1000}
                        step={10}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Price Summary & Contract Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-4"
              >
                <div className="bg-card rounded-xl p-5 border border-border sticky top-[80px]">
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Order Summary
                  </h3>

                  {selectedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Select energy sources to compare
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {selectedItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <item.icon className="w-4 h-4" /> {item.producer}
                            </span>
                            <span className="font-semibold text-foreground">₹{item.price}/kWh</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Average Price</span>
                          <span className="font-semibold text-foreground">₹{avgPrice.toFixed(2)}/kWh</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Volume</span>
                          <span className="font-semibold text-foreground">{volume} kWh</span>
                        </div>
                        <div className="flex justify-between text-lg mt-3 pt-3 border-t border-border">
                          <span className="font-semibold text-foreground">Estimated Cost</span>
                          <span className="font-heading font-bold text-primary">₹{totalCost.toFixed(0)}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-5"
                        onClick={() => setShowContract(!showContract)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {showContract ? "Hide Contract Preview" : "Preview Contract"}
                      </Button>
                    </>
                  )}
                </div>

                {/* Contract Preview */}
                {showContract && selectedItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card rounded-xl p-5 border border-primary/20"
                  >
                    <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Contract Preview
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contract ID</span>
                        <span className="font-mono text-foreground">GG-{Date.now().toString(36).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="text-foreground">Energy Purchase Agreement</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="text-foreground">30 Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="text-foreground">Grid-Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Settlement</span>
                        <span className="text-foreground">Weekly</span>
                      </div>
                    </div>
                    <Button className="w-full mt-5" variant="default"
                      disabled={buyMutation.isPending}
                      onClick={() => {
                        selectedItems.forEach(item => {
                          buyMutation.mutate({ listing_id: item.id, quantity_kwh: volume });
                        });
                      }}
                    >
                      {buyMutation.isPending ? "Processing..." : "Create Contract"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    {buyMutation.isSuccess && (
                      <p className="text-xs text-primary mt-2 text-center">Purchase successful!</p>
                    )}
                    {buyMutation.isError && (
                      <p className="text-xs text-destructive mt-2 text-center">Purchase failed. Try again.</p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default BuyEnergy;

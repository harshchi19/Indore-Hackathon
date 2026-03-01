import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { 
  History, Search, Filter, Download, Calendar, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Zap, Sun, Wind, Droplets, Leaf, ChevronLeft, ChevronRight
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";
import { LoadingSpinner, ErrorCard, EmptyState } from "@/components/ui/ApiStates";
import { useContracts } from "@/hooks/useContracts";

interface Trade {
  id: string;
  type: "buy" | "sell";
  energyType: "solar" | "wind" | "hydro" | "biogas";
  counterparty: string;
  volume: string;
  pricePerUnit: string;
  totalValue: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  txHash: string;
}

const TradingHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");

  const { data: contractsRes, isLoading, error, refetch } = useContracts({ limit: 100 });

  const trades: Trade[] = useMemo(() => {
    if (!contractsRes?.items) return [];
    return contractsRes.items.map((c) => ({
      id: c.id.slice(0, 8).toUpperCase(),
      type: (c.buyer_id === c.id ? "sell" : "buy") as "buy" | "sell",
      energyType: "solar" as Trade["energyType"],
      counterparty: c.producer_id?.slice(0, 12) || "Unknown",
      volume: `${c.volume_kwh} kWh`,
      pricePerUnit: `₹${c.price_per_kwh.toFixed(2)}`,
      totalValue: `₹${c.total_amount.toLocaleString()}`,
      timestamp: new Date(c.created_at).toLocaleString(),
      status: (c.status === "settled" ? "completed" : c.status === "active" ? "pending" : "completed") as Trade["status"],
      txHash: `0x${c.id.slice(0, 8)}...${c.id.slice(-4)}`,
    }));
  }, [contractsRes]);

  const volumeChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((m) => ({
      date: m,
      bought: trades.filter(t => t.type === "buy").reduce((s, t) => s + parseFloat(t.volume), 0) / 6,
      sold: trades.filter(t => t.type === "sell").reduce((s, t) => s + parseFloat(t.volume), 0) / 6,
    }));
  }, [trades]);

  const getEnergyIcon = (type: Trade["energyType"]) => {
    switch (type) {
      case "solar":
        return <Sun className="w-4 h-4 text-saffron" />;
      case "wind":
        return <Wind className="w-4 h-4 text-accent" />;
      case "hydro":
        return <Droplets className="w-4 h-4 text-blue-400" />;
      case "biogas":
        return <Leaf className="w-4 h-4 text-primary" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Trade["status"]) => {
    switch (status) {
      case "completed":
        return "bg-primary/10 text-primary border-primary/20";
      case "pending":
        return "bg-saffron/10 text-saffron border-saffron/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || trade.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalTrades: trades.length,
    totalBought: `₹${trades.filter(t => t.type === "buy").reduce((s, t) => s + parseFloat(t.totalValue.replace(/[₹,]/g, "")), 0).toLocaleString()}`,
    totalSold: `₹${trades.filter(t => t.type === "sell").reduce((s, t) => s + parseFloat(t.totalValue.replace(/[₹,]/g, "")), 0).toLocaleString()}`,
    volumeTraded: `${trades.reduce((s, t) => s + parseFloat(t.volume), 0).toLocaleString()} kWh`,
  };

  if (isLoading) return <AppLayout><PageTransition><LoadingSpinner message="Loading trading history..." /></PageTransition></AppLayout>;
  if (error) return <AppLayout><PageTransition><ErrorCard message={error.message} onRetry={refetch} /></PageTransition></AppLayout>;

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">Trading History</h1>
                <p className="text-sm text-muted-foreground mt-1">View your complete P2P energy trading history</p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Trades", value: stats.totalTrades, icon: History, color: "text-foreground" },
                { label: "Total Bought", value: stats.totalBought, icon: ArrowDownLeft, color: "text-accent" },
                { label: "Total Sold", value: stats.totalSold, icon: ArrowUpRight, color: "text-primary" },
                { label: "Volume Traded", value: stats.volumeTraded, icon: Zap, color: "text-saffron" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Trading Volume Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={volumeChartData}>
                        <defs>
                          <linearGradient id="boughtGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="soldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="bought"
                          stroke="hsl(217 91% 60%)"
                          fill="url(#boughtGradient)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="sold"
                          stroke="hsl(142 72% 40%)"
                          fill="url(#soldGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <span className="text-sm text-muted-foreground">Bought</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm text-muted-foreground">Sold</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Monthly Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={volumeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="bought" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sold" fill="hsl(142 72% 40%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <span className="text-sm text-muted-foreground">Bought (kWh)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm text-muted-foreground">Sold (kWh)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Trade List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-lg">Recent Trades</CardTitle>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search trades..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64 bg-background/50"
                        />
                      </div>
                      <div className="flex rounded-lg border border-border overflow-hidden">
                        {["all", "buy", "sell"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setFilterType(type as typeof filterType)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                              filterType === type
                                ? "bg-primary text-primary-foreground"
                                : "bg-background/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trade ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Energy</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Counterparty</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Volume</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrades.map((trade, i) => (
                          <motion.tr
                            key={trade.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <span className="text-sm font-mono text-muted-foreground">{trade.id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {trade.type === "buy" ? (
                                  <ArrowDownLeft className="w-4 h-4 text-accent" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 text-primary" />
                                )}
                                <span className={`text-sm font-medium capitalize ${
                                  trade.type === "buy" ? "text-accent" : "text-primary"
                                }`}>
                                  {trade.type}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {getEnergyIcon(trade.energyType)}
                                <span className="text-sm capitalize">{trade.energyType}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">{trade.counterparty}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm font-medium">{trade.volume}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">{trade.pricePerUnit}/kWh</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm font-medium ${
                                trade.type === "buy" ? "text-destructive" : "text-primary"
                              }`}>
                                {trade.type === "buy" ? "-" : "+"}{trade.totalValue}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusColor(trade.status)}>
                                {trade.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-muted-foreground">{trade.timestamp}</span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredTrades.length} of {trades.length} trades
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                        1
                      </Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">3</Button>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default TradingHistory;

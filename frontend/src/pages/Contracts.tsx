import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Search, Filter, Plus, Calendar, Clock, CheckCircle2, 
  XCircle, AlertTriangle, ArrowRight, Download, Eye, Edit2,
  Zap, User, Building2, TrendingUp, RefreshCw
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";
import { LoadingSpinner, ErrorCard, EmptyState } from "@/components/ui/ApiStates";
import { useContracts } from "@/hooks/useContracts";

interface Contract {
  id: string;
  title: string;
  counterparty: string;
  counterpartyType: "producer" | "consumer";
  energyType: "solar" | "wind" | "hydro" | "biogas";
  volume: string;
  pricePerUnit: string;
  totalValue: string;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "completed" | "cancelled" | "disputed";
  deliveredVolume: string;
  progress: number;
}

const Contracts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const { data: contractsRes, isLoading, error, refetch } = useContracts({ limit: 100 });

  // Map API response to UI-friendly shape
  const contracts: Contract[] = useMemo(() => {
    if (!contractsRes?.items) return [];
    return contractsRes.items.map((c) => {
      const statusMap: Record<string, Contract["status"]> = {
        pending: "pending", active: "active", settled: "completed", disputed: "disputed",
      };
      // Deterministic progress based on creation age (days since created / 90 days cap)
      const ageMs = Date.now() - new Date(c.created_at).getTime();
      const ageDays = Math.floor(ageMs / 86400000);
      const progress = c.status === "settled" ? 100 : c.status === "pending" ? 0 : Math.min(90, Math.max(10, Math.round(ageDays / 90 * 80 + 10)));
      return {
        id: c.id,
        title: `${c.contract_type === "spot" ? "Spot" : "Scheduled"} Energy Contract`,
        counterparty: c.producer_id?.slice(-6) || "Unknown",
        counterpartyType: "producer" as const,
        energyType: "solar" as Contract["energyType"],
        volume: `${c.volume_kwh.toLocaleString()} kWh`,
        pricePerUnit: `₹${c.price_per_kwh.toFixed(2)}/kWh`,
        totalValue: `₹${c.total_amount.toLocaleString()}`,
        startDate: new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        endDate: c.settled_at ? new Date(c.settled_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Ongoing",
        status: statusMap[c.status] || "pending",
        deliveredVolume: `${Math.round(c.volume_kwh * progress / 100).toLocaleString()} kWh`,
        progress,
      };
    });
  }, [contractsRes]);

  const getStatusColor = (status: Contract["status"]) => {
    switch (status) {
      case "active":
        return "bg-primary/10 text-primary border-primary/20";
      case "pending":
        return "bg-saffron/10 text-saffron border-saffron/20";
      case "completed":
        return "bg-accent/10 text-accent border-accent/20";
      case "cancelled":
        return "bg-muted text-muted-foreground border-border";
      case "disputed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: Contract["status"]) => {
    switch (status) {
      case "active":
        return <RefreshCw className="w-3 h-3" />;
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "completed":
        return <CheckCircle2 className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      case "disputed":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getEnergyColor = (type: Contract["energyType"]) => {
    switch (type) {
      case "solar":
        return "text-saffron";
      case "wind":
        return "text-accent";
      case "hydro":
        return "text-blue-400";
      case "biogas":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === "active").length,
    pending: contracts.filter((c) => c.status === "pending").length,
    totalValue: `₹${contracts.reduce((s, c) => s + parseFloat(c.totalValue.replace(/[₹,]/g, "")), 0).toLocaleString()}`,
  };

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AppLayout><PageTransition><LoadingSpinner message="Loading contracts..." /></PageTransition></AppLayout>
    );
  }

  if (error && !contractsRes) {
    return (
      <AppLayout><PageTransition><ErrorCard message="Failed to load contracts" onRetry={() => refetch()} /></PageTransition></AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">Contracts</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your P2P energy trading agreements</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Contract
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Contracts", value: stats.total, icon: FileText, color: "text-foreground" },
                { label: "Active", value: stats.active, icon: RefreshCw, color: "text-primary" },
                { label: "Pending", value: stats.pending, icon: Clock, color: "text-saffron" },
                { label: "Total Value", value: stats.totalValue, icon: TrendingUp, color: "text-accent" },
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

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Contract List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search & Filter */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search contracts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-background/50"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="all">
                  <TabsList className="bg-card/80 border border-border">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-3 mt-4">
                    {filteredContracts.map((contract, i) => (
                      <motion.div
                        key={contract.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className={`bg-card/80 backdrop-blur-sm border-border cursor-pointer transition-all hover:border-primary/50 ${
                            selectedContract?.id === contract.id ? "border-primary" : ""
                          }`}
                          onClick={() => setSelectedContract(contract)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center`}>
                                  <Zap className={`w-5 h-5 ${getEnergyColor(contract.energyType)}`} />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{contract.title}</p>
                                  <p className="text-xs text-muted-foreground">{contract.id}</p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(contract.status)}>
                                {getStatusIcon(contract.status)}
                                <span className="ml-1 capitalize">{contract.status}</span>
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                              <div>
                                <p className="text-muted-foreground text-xs">Counterparty</p>
                                <p className="font-medium truncate">{contract.counterparty}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Volume</p>
                                <p className="font-medium">{contract.volume}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Total Value</p>
                                <p className="font-medium text-primary">{contract.totalValue}</p>
                              </div>
                            </div>

                            {contract.status === "active" && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="text-foreground">{contract.progress}%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                                    style={{ width: `${contract.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </TabsContent>

                  <TabsContent value="active" className="space-y-3 mt-4">
                    {filteredContracts.filter(c => c.status === "active").map((contract, i) => (
                      <motion.div
                        key={contract.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className="bg-card/80 backdrop-blur-sm border-border cursor-pointer transition-all hover:border-primary/50"
                          onClick={() => setSelectedContract(contract)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Zap className={`w-5 h-5 ${getEnergyColor(contract.energyType)}`} />
                                <div>
                                  <p className="font-medium">{contract.title}</p>
                                  <p className="text-xs text-muted-foreground">{contract.counterparty}</p>
                                </div>
                              </div>
                              <span className="text-primary font-medium">{contract.totalValue}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-3 mt-4">
                    {filteredContracts.filter(c => c.status === "pending").map((contract, i) => (
                      <motion.div
                        key={contract.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className="bg-card/80 backdrop-blur-sm border-border cursor-pointer transition-all hover:border-primary/50"
                          onClick={() => setSelectedContract(contract)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Zap className={`w-5 h-5 ${getEnergyColor(contract.energyType)}`} />
                                <div>
                                  <p className="font-medium">{contract.title}</p>
                                  <p className="text-xs text-muted-foreground">{contract.counterparty}</p>
                                </div>
                              </div>
                              <Badge className="bg-saffron/10 text-saffron border-saffron/20">Pending Approval</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-3 mt-4">
                    {filteredContracts.filter(c => c.status === "completed").map((contract, i) => (
                      <motion.div
                        key={contract.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className="bg-card/80 backdrop-blur-sm border-border cursor-pointer transition-all hover:border-primary/50"
                          onClick={() => setSelectedContract(contract)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Zap className={`w-5 h-5 ${getEnergyColor(contract.energyType)}`} />
                                <div>
                                  <p className="font-medium">{contract.title}</p>
                                  <p className="text-xs text-muted-foreground">{contract.counterparty}</p>
                                </div>
                              </div>
                              <Badge className="bg-accent/10 text-accent border-accent/20">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Contract Details */}
              <div className="space-y-4">
                <Card className="bg-card/80 backdrop-blur-sm border-border sticky top-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Contract Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedContract ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(selectedContract.status)}>
                            {getStatusIcon(selectedContract.status)}
                            <span className="ml-1 capitalize">{selectedContract.status}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">{selectedContract.id}</span>
                        </div>

                        <div>
                          <h3 className="font-medium text-foreground">{selectedContract.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Contract with {selectedContract.counterparty}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-xs text-muted-foreground">Energy Type</p>
                            <p className={`font-medium capitalize ${getEnergyColor(selectedContract.energyType)}`}>
                              {selectedContract.energyType}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-xs text-muted-foreground">Volume</p>
                            <p className="font-medium">{selectedContract.volume}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-xs text-muted-foreground">Price/Unit</p>
                            <p className="font-medium">{selectedContract.pricePerUnit}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-xs text-muted-foreground">Total Value</p>
                            <p className="font-medium text-primary">{selectedContract.totalValue}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Start:</span>
                            <span className="font-medium">{selectedContract.startDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">End:</span>
                            <span className="font-medium">{selectedContract.endDate}</span>
                          </div>
                        </div>

                        {selectedContract.status === "active" && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Delivered</span>
                              <span className="font-medium">{selectedContract.deliveredVolume}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                style={{ width: `${selectedContract.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {selectedContract.progress}% complete
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                          {selectedContract.status === "active" && (
                            <Button variant="outline" size="sm" className="flex-1">
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">Select a contract to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Contracts;

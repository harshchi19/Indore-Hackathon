import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { 
  Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Send, 
  QrCode, Copy, CheckCircle2, Clock, RefreshCw, Shield, ExternalLink,
  TrendingUp, Zap, Banknote, Building2
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";
import { LoadingSpinner, ErrorCard } from "@/components/ui/ApiStates";
import { usePayments } from "@/hooks/usePayments";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  description: string;
  amount: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  category: "energy_purchase" | "energy_sale" | "deposit" | "withdrawal" | "refund";
}

const WalletPage = () => {
  const [copied, setCopied] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  const { data: paymentsRes, isLoading, error, refetch } = usePayments({ limit: 50 });

  const transactions: Transaction[] = useMemo(() => {
    if (!paymentsRes?.items) return [];
    return paymentsRes.items.map((p) => ({
      id: p.id,
      type: p.amount > 0 ? "debit" as const : "credit" as const,
      description: `Payment ${p.id.slice(0, 8)} - Contract ${p.contract_id.slice(0, 8)}`,
      amount: `₹${Math.abs(p.amount).toLocaleString()}`,
      timestamp: new Date(p.created_at).toLocaleString(),
      status: (p.status === "completed" ? "completed" : p.status === "pending" ? "pending" : "failed") as Transaction["status"],
      category: "energy_purchase" as const,
    }));
  }, [paymentsRes]);

  const totalSpent = useMemo(() => {
    if (!paymentsRes?.items) return 0;
    return paymentsRes.items.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  }, [paymentsRes]);

  const pendingAmount = useMemo(() => {
    if (!paymentsRes?.items) return 0;
    return paymentsRes.items.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  }, [paymentsRes]);

  const walletData = {
    balance: `₹${(12450 - totalSpent).toLocaleString()}`,
    pendingBalance: `₹${pendingAmount.toLocaleString()}`,
    energyCredits: "850 kWh",
    escrowBalance: `₹${Math.round(pendingAmount * 0.5).toLocaleString()}`,
    walletAddress: "0x7f9e8d...3a4b5c6d",
  };

  const balanceHistory = [
    { date: "Mon", balance: 8500 },
    { date: "Tue", balance: 9200 },
    { date: "Wed", balance: 8800 },
    { date: "Thu", balance: 10500 },
    { date: "Fri", balance: 12300 },
    { date: "Sat", balance: 11800 },
    { date: "Sun", balance: 12450 - totalSpent },
  ];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: Transaction["status"]) => {
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

  const getCategoryIcon = (category: Transaction["category"]) => {
    switch (category) {
      case "energy_purchase":
        return <Zap className="w-4 h-4 text-accent" />;
      case "energy_sale":
        return <Zap className="w-4 h-4 text-primary" />;
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-primary" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case "refund":
        return <RefreshCw className="w-4 h-4 text-saffron" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  if (isLoading) return <AppLayout><PageTransition><LoadingSpinner message="Loading wallet..." /></PageTransition></AppLayout>;
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
                <h1 className="text-2xl font-heading font-bold text-foreground">Wallet</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your balance and transactions</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Funds
                </Button>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                        <p className="text-3xl font-bold font-heading text-foreground mt-1">{walletData.balance}</p>
                        <p className="text-xs text-primary mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +12.5% this week
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold font-heading text-saffron mt-1">{walletData.pendingBalance}</p>
                        <p className="text-xs text-muted-foreground mt-2">In process</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-saffron" />
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
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Energy Credits</p>
                        <p className="text-2xl font-bold font-heading text-primary mt-1">{walletData.energyCredits}</p>
                        <p className="text-xs text-muted-foreground mt-2">Available to trade</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Escrow</p>
                        <p className="text-2xl font-bold font-heading text-accent mt-1">{walletData.escrowBalance}</p>
                        <p className="text-xs text-muted-foreground mt-2">Locked in contracts</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Balance Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Balance History</CardTitle>
                    <CardDescription>Your wallet balance over the past week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={balanceHistory}>
                        <defs>
                          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142 72% 40%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(142 72% 40%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, "Balance"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          stroke="hsl(142 72% 40%)"
                          fill="url(#balanceGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Wallet Address */}
                    <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                      <p className="text-xs text-muted-foreground">Wallet Address</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono">{walletData.walletAddress}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleCopy}
                          >
                            {copied ? (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <QrCode className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Add */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Quick Top-up</p>
                      <div className="grid grid-cols-3 gap-2">
                        {["₹500", "₹1,000", "₹2,000"].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setAddAmount(amount.replace("₹", "").replace(",", ""))}
                          >
                            {amount}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Custom amount"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          className="bg-background/50"
                        />
                        <Button className="shrink-0">Add</Button>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Linked Accounts</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-5 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                              <CreditCard className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm">•••• 4242</span>
                          </div>
                          <Badge variant="outline" className="text-xs">Default</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-5 rounded bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center">
                              <Banknote className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm">UPI - rahul@okaxis</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    <Button variant="ghost" size="sm">
                      View All
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="bg-muted/30 mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="credits">Credits</TabsTrigger>
                      <TabsTrigger value="debits">Debits</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-2">
                      {transactions.map((txn, i) => (
                        <motion.div
                          key={txn.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              txn.type === "credit" ? "bg-primary/10" : "bg-destructive/10"
                            }`}>
                              {getCategoryIcon(txn.category)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{txn.description}</p>
                              <p className="text-xs text-muted-foreground">{txn.timestamp}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              txn.type === "credit" ? "text-primary" : "text-destructive"
                            }`}>
                              {txn.type === "credit" ? "+" : "-"}{txn.amount}
                            </p>
                            <Badge className={`${getStatusColor(txn.status)} text-xs`}>
                              {txn.status}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </TabsContent>

                    <TabsContent value="credits" className="space-y-2">
                      {transactions.filter(t => t.type === "credit").map((txn, i) => (
                        <motion.div
                          key={txn.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              {getCategoryIcon(txn.category)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{txn.description}</p>
                              <p className="text-xs text-muted-foreground">{txn.timestamp}</p>
                            </div>
                          </div>
                          <p className="font-medium text-primary">+{txn.amount}</p>
                        </motion.div>
                      ))}
                    </TabsContent>

                    <TabsContent value="debits" className="space-y-2">
                      {transactions.filter(t => t.type === "debit").map((txn, i) => (
                        <motion.div
                          key={txn.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                              {getCategoryIcon(txn.category)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{txn.description}</p>
                              <p className="text-xs text-muted-foreground">{txn.timestamp}</p>
                            </div>
                          </div>
                          <p className="font-medium text-destructive">-{txn.amount}</p>
                        </motion.div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default WalletPage;

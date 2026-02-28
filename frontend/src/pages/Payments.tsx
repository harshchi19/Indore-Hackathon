import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, FileText, CheckCircle, Clock, AlertCircle, IndianRupee, Calendar, Settings, ArrowUpRight, LucideIcon } from "lucide-react";
import { useState } from "react";

const invoices = [
  { id: "INV-2026-001", date: "2026-02-25", amount: 4250, status: "paid", description: "Energy Purchase - SolarFarm Alpha" },
  { id: "INV-2026-002", date: "2026-02-20", amount: 2180, status: "paid", description: "Energy Purchase - WindTech Pune" },
  { id: "INV-2026-003", date: "2026-02-15", amount: 3820, status: "pending", description: "Energy Purchase - HydroFlow Kerala" },
  { id: "INV-2026-004", date: "2026-02-10", amount: 1560, status: "paid", description: "Energy Purchase - SolarMax Delhi" },
  { id: "INV-2026-005", date: "2026-02-05", amount: 5200, status: "overdue", description: "Energy Purchase - GreenWind TN" },
  { id: "INV-2026-006", date: "2026-01-28", amount: 2890, status: "paid", description: "Energy Purchase - MicroSolar Goa" },
];

const statusColors: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
  paid: { bg: "bg-primary/10", text: "text-primary", icon: CheckCircle },
  pending: { bg: "bg-saffron/10", text: "text-saffron", icon: Clock },
  overdue: { bg: "bg-destructive/10", text: "text-destructive", icon: AlertCircle },
};

const Payments = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices[0] | null>(null);

  const totalSpent = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices.filter(i => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0);

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
                background: "linear-gradient(135deg, hsl(217 91% 50% / 0.9), hsl(142 72% 35% / 0.7), hsl(30 100% 55% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <CreditCard className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Billing Center</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Payments & Billing
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    View invoices, track payments, and manage billing settings.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">₹<AnimatedCounter end={totalSpent} /></p>
                    <p className="text-[11px] text-white/60 mt-1">Total Spent</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">₹<AnimatedCounter end={outstanding} /></p>
                    <p className="text-[11px] text-white/60 mt-1">Outstanding</p>
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
                { label: "Total Spent", value: `₹${totalSpent.toLocaleString()}`, icon: IndianRupee, gradient: "from-primary/20 to-primary/5" },
                { label: "Outstanding", value: `₹${outstanding.toLocaleString()}`, icon: Clock, gradient: "from-saffron/20 to-saffron/5" },
                { label: "Invoices", value: invoices.length.toString(), icon: FileText, gradient: "from-accent/20 to-accent/5" },
                { label: "Settlement Cycle", value: "Weekly", icon: Calendar, gradient: "from-primary/20 to-accent/5" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-xl font-heading font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Invoice Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 bg-card rounded-xl p-5 border border-border"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Invoices
                  </h3>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="w-3 h-3 mr-1" /> Export CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="pb-3 font-medium">Invoice ID</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Description</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice, i) => {
                        const status = statusColors[invoice.status];
                        const StatusIcon = status.icon;
                        return (
                          <motion.tr
                            key={invoice.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.05 }}
                            onClick={() => setSelectedInvoice(invoice)}
                            className={`border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${
                              selectedInvoice?.id === invoice.id ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="py-3 font-mono text-foreground">{invoice.id}</td>
                            <td className="py-3 text-muted-foreground">{invoice.date}</td>
                            <td className="py-3 text-foreground max-w-[200px] truncate">{invoice.description}</td>
                            <td className="py-3 font-heading font-bold text-foreground">₹{invoice.amount.toLocaleString()}</td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
                                <StatusIcon className="w-3 h-3" />
                                {invoice.status}
                              </span>
                            </td>
                            <td className="py-3">
                              <Button variant="ghost" size="sm" className="text-xs h-7">
                                <Download className="w-3 h-3" />
                              </Button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Right Panel */}
              <div className="space-y-6">
                {/* Invoice Details */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Invoice Details
                  </h3>

                  {selectedInvoice ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/30 p-4 text-center">
                        <p className="font-mono font-bold text-foreground text-lg">{selectedInvoice.id}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[selectedInvoice.status].bg} ${statusColors[selectedInvoice.status].text}`}>
                          {selectedInvoice.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span className="text-foreground">{selectedInvoice.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-heading font-bold text-primary">₹{selectedInvoice.amount.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Description</p>
                          <p className="text-sm text-foreground">{selectedInvoice.description}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1 text-xs">
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                        {selectedInvoice.status !== "paid" && (
                          <Button variant="default" className="text-xs">Pay Now</Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Select an invoice to view details
                    </p>
                  )}
                </motion.div>

                {/* Payment Settings */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" /> Payment Settings
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">Default Payment</p>
                        <p className="text-xs text-muted-foreground">HDFC •••• 4521</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">Auto-pay</p>
                        <p className="text-xs text-muted-foreground">Enabled</p>
                      </div>
                      <span className="w-8 h-4 rounded-full bg-primary flex items-center justify-end px-0.5">
                        <span className="w-3 h-3 rounded-full bg-white" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">Billing Address</p>
                        <p className="text-xs text-muted-foreground">Mumbai, MH 400001</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Payments;

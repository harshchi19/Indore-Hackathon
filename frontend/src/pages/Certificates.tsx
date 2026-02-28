import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Award, Download, CheckCircle, Shield, Calendar, FileText, ExternalLink, Plus, Search, Zap, Leaf } from "lucide-react";
import { useState } from "react";

const certificates = [
  { id: "REC-2026-001", type: "REC", standard: "I-REC", energy: "500 kWh", issued: "2026-02-15", expiry: "2027-02-15", issuer: "Bureau of Energy Efficiency", status: "valid", hash: "0x8f3a...c91b" },
  { id: "REC-2026-002", type: "G-GO", standard: "EECS", energy: "1,200 kWh", issued: "2026-02-10", expiry: "2027-02-10", issuer: "AIB Hub", status: "valid", hash: "0x2d7e...f4a3" },
  { id: "REC-2026-003", type: "REC", standard: "I-REC", energy: "800 kWh", issued: "2026-01-28", expiry: "2027-01-28", issuer: "Bureau of Energy Efficiency", status: "valid", hash: "0x5b1c...8e2d" },
  { id: "REC-2025-048", type: "I-REC", standard: "I-REC", energy: "2,000 kWh", issued: "2025-12-15", expiry: "2026-12-15", issuer: "APX", status: "valid", hash: "0x9a4f...b7c6" },
  { id: "REC-2025-032", type: "G-GO", standard: "EECS", energy: "350 kWh", issued: "2025-10-20", expiry: "2026-10-20", issuer: "AIB Hub", status: "expired", hash: "0x1f8b...a5e9" },
  { id: "REC-2025-019", type: "REC", standard: "REC Registry", energy: "1,500 kWh", issued: "2025-08-05", expiry: "2026-08-05", issuer: "India REC Registry", status: "valid", hash: "0x7c3d...d2f1" },
];

const certTypeColors: Record<string, string> = {
  "REC": "bg-primary/10 text-primary border-primary/20",
  "G-GO": "bg-accent/10 text-accent border-accent/20",
  "I-REC": "bg-saffron/10 text-saffron border-saffron/20",
};

const Certificates = () => {
  const [filter, setFilter] = useState("All");
  const [selectedCert, setSelectedCert] = useState<typeof certificates[0] | null>(null);

  const filtered = filter === "All" ? certificates : certificates.filter(c => c.type === filter);

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
                background: "linear-gradient(135deg, hsl(142 72% 35% / 0.9), hsl(30 100% 55% / 0.7), hsl(142 72% 40% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Award className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Renewable Energy Certificates</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Certificate Management
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Manage REC, G-GO, and I-REC certificates. Download, validate, and issue certificates.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={6} />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Certificates</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={6350} suffix=" kWh" />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Total Certified</p>
                  </div>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <Plus className="w-4 h-4 mr-2" /> Issue Certificate
                  </Button>
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
                { label: "Valid Certificates", value: "5", icon: CheckCircle, gradient: "from-primary/20 to-primary/5" },
                { label: "Total Energy", value: "6,350 kWh", icon: Zap, gradient: "from-accent/20 to-accent/5" },
                { label: "CO₂ Avoided", value: "4,445 kg", icon: Leaf, gradient: "from-primary/20 to-accent/5" },
                { label: "Verified On-Chain", value: "100%", icon: Shield, gradient: "from-saffron/20 to-saffron/5" },
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

            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card rounded-xl p-4 flex flex-wrap items-center gap-4 border border-border"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1.5">
                {["All", "REC", "G-GO", "I-REC"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      filter === f
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                {filtered.length} certificates
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Certificates Grid */}
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                {filtered.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onClick={() => setSelectedCert(cert)}
                    className={`group cursor-pointer relative bg-card rounded-xl p-5 border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 ${
                      selectedCert?.id === cert.id ? "border-primary" : "border-border hover:border-primary/20"
                    }`}
                  >
                    <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-primary/30 via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${certTypeColors[cert.type]}`}>
                        {cert.type}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        cert.status === "valid" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      }`}>
                        {cert.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-mono font-semibold text-sm text-foreground">{cert.id}</h4>
                        <p className="text-xs text-muted-foreground">{cert.standard}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Energy Amount</span>
                        <span className="font-semibold text-primary">{cert.energy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issued</span>
                        <span className="text-foreground">{cert.issued}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expiry</span>
                        <span className="text-foreground">{cert.expiry}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" /> Validate
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Certificate Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl p-5 border border-border h-fit sticky top-[80px]"
              >
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Certificate Details
                </h3>

                {selectedCert ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted/30 p-4 text-center">
                      <Award className="w-12 h-12 text-primary mx-auto mb-2" />
                      <p className="font-mono font-bold text-foreground">{selectedCert.id}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${certTypeColors[selectedCert.type]}`}>
                        {selectedCert.type} • {selectedCert.standard}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Energy Amount</span>
                        <span className="font-semibold text-primary">{selectedCert.energy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issued Date</span>
                        <span className="text-foreground">{selectedCert.issued}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expiry Date</span>
                        <span className="text-foreground">{selectedCert.expiry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issuer</span>
                        <span className="text-foreground text-right">{selectedCert.issuer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className={`font-semibold ${selectedCert.status === "valid" ? "text-primary" : "text-destructive"}`}>
                          {selectedCert.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Verification Hash</p>
                        <p className="font-mono text-xs text-foreground bg-muted/30 p-2 rounded">{selectedCert.hash}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1 text-xs">
                        <Download className="w-3 h-3 mr-1" /> Download PDF
                      </Button>
                      <Button variant="outline" className="text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" /> Verify
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    Select a certificate to view details
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Certificates;

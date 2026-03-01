import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LoadingSpinner, ErrorCard, EmptyState } from "@/components/ui/ApiStates";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Scale, FileText, Upload, MessageSquare, Clock, CheckCircle, AlertCircle, Plus, ArrowRight, History, LucideIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { useDisputes } from "@/hooks/useDisputes";
import { toast } from "sonner";

const statusColors: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
  open: { bg: "bg-saffron/10", text: "text-saffron", icon: AlertCircle },
  reviewing: { bg: "bg-accent/10", text: "text-accent", icon: Clock },
  resolved: { bg: "bg-primary/10", text: "text-primary", icon: CheckCircle },
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-saffron/10 text-saffron",
  low: "bg-muted text-muted-foreground",
};

const Disputes = () => {
  const { data: disputesRes, isLoading, error, refetch } = useDisputes({ limit: 50 });

  const disputes = useMemo(() => {
    if (!disputesRes?.items) return [];
    return disputesRes.items.map((d) => ({
      id: d.id,
      title: d.description.slice(0, 50) || "Dispute",
      contract: d.contract_id,
      status: d.status,
      priority: d.status === "open" ? "high" : d.status === "reviewing" ? "medium" : "low",
      created: new Date(d.created_at).toISOString().split("T")[0],
      lastUpdate: d.updated_at ? new Date(d.updated_at).toLocaleString() : "N/A",
      evidence: d.evidence || [],
      auditLog: d.audit_log || [],
      resolutionNote: d.resolution_note,
    }));
  }, [disputesRes]);

  const [activeDispute, setActiveDispute] = useState<typeof disputes[0] | null>(null);

  // Update active dispute if data loaded
  const currentDispute = activeDispute || disputes[0] || null;

  const auditLog = useMemo(() => {
    if (!currentDispute?.auditLog?.length) return [];
    return currentDispute.auditLog.map((entry: any) => ({
      time: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "",
      action: entry.action,
      actor: entry.actor,
    }));
  }, [currentDispute]);

  const messages = useMemo(() => {
    if (!currentDispute) return [];
    return [
      { id: 1, from: currentDispute.id, role: "Reporter", message: currentDispute.title, time: currentDispute.created },
      ...(currentDispute.resolutionNote ? [{ id: 2, from: "Resolution Team", role: "Mediator", message: currentDispute.resolutionNote, time: currentDispute.lastUpdate }] : []),
    ];
  }, [currentDispute]);

  if (isLoading) {
    return <AppLayout><PageTransition><LoadingSpinner message="Loading disputes..." /></PageTransition></AppLayout>;
  }

  if (error && !disputesRes) {
    return <AppLayout><PageTransition><ErrorCard message="Failed to load disputes" onRetry={() => refetch()} /></PageTransition></AppLayout>;
  }

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
                background: "linear-gradient(135deg, hsl(217 91% 50% / 0.9), hsl(30 100% 55% / 0.7), hsl(217 91% 55% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Scale className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Dispute Center</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Dispute Resolution
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Raise, track, and manage disputes. Upload evidence and communicate with resolution teams.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={disputes.length} />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Total Disputes</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={disputes.filter(d => d.status !== "resolved").length} />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Active</p>
                  </div>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => toast.info("New dispute form coming soon")}>
                    <Plus className="w-4 h-4 mr-2" /> New Dispute
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Dispute List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-xl p-5 border border-border"
              >
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Disputes
                </h3>

                <div className="space-y-3">
                  {disputes.map((dispute, i) => {
                    const status = statusColors[dispute.status];
                    const StatusIcon = status.icon;
                    const isActive = currentDispute?.id === dispute.id;
                    return (
                      <motion.div
                        key={dispute.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        onClick={() => setActiveDispute(dispute)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isActive ? "bg-primary/5 border-primary/30" : "bg-muted/20 border-border hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-muted-foreground">{dispute.id}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityColors[dispute.priority]}`}>
                            {dispute.priority}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-foreground mb-1">{dispute.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">Contract: {dispute.contract}</p>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {dispute.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{dispute.lastUpdate}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Dispute Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Details Panel */}
                <div className="bg-card rounded-xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary" /> {currentDispute?.id}
                    </h3>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[currentDispute?.status || 'open'].bg} ${statusColors[currentDispute?.status || 'open'].text}`}>
                      {currentDispute?.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title</span>
                        <span className="text-foreground font-medium">{currentDispute?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contract</span>
                        <span className="font-mono text-foreground">{currentDispute?.contract}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Priority</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[currentDispute?.priority || 'low']}`}>{currentDispute?.priority}</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="text-foreground">{currentDispute?.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Update</span>
                        <span className="text-foreground">{currentDispute?.lastUpdate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => toast.info("Evidence upload feature coming soon")}>
                      <Upload className="w-3 h-3 mr-1" /> Upload Evidence
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => toast.info("Full history view coming soon")}>
                      <History className="w-3 h-3 mr-1" /> View Full History
                    </Button>
                  </div>
                </div>

                {/* Communication Thread */}
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Communication Thread
                  </h3>

                  <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className={`p-4 rounded-xl ${
                          msg.role === "Consumer" ? "bg-primary/5 border border-primary/10 ml-0 mr-8" :
                          msg.role === "Mediator" ? "bg-muted/30 border border-border mx-4" :
                          "bg-saffron/5 border border-saffron/10 ml-8 mr-0"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{msg.from}</span>
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{msg.role}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.message}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 h-10 px-4 text-sm rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                    />
                    <Button className="h-10" onClick={() => toast.success("Message sent to dispute thread")}>
                      Send <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Audit Log */}
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" /> Audit Log
                  </h3>

                  <div className="space-y-2">
                    {auditLog.map((log, i) => (
                      <div key={i} className="flex items-center gap-4 text-sm py-2 border-b border-border/50 last:border-0">
                        <span className="font-mono text-xs text-muted-foreground w-36 flex-shrink-0">{log.time}</span>
                        <span className="text-foreground flex-1">{log.action}</span>
                        <span className="text-xs text-muted-foreground">{log.actor}</span>
                      </div>
                    ))}
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

export default Disputes;

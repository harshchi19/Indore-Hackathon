// TODO: Backend integration pending — No /api/v1/kyc endpoint exists yet.
// This page uses hardcoded verificationSteps, documents, and reviewerMessages.
// When a KYC/verification API is created, replace with service calls.
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Upload, CheckCircle, Clock, AlertCircle, FileText, User, Building, MapPin, RefreshCw, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/* TODO: Replace with API data when backend KYC endpoint is available */
const verificationSteps = [
  { id: 1, title: "Personal Information", description: "Basic identity details", status: "completed" },
  { id: 2, title: "Identity Document", description: "Government-issued ID", status: "completed" },
  { id: 3, title: "Address Verification", description: "Proof of address", status: "in-progress" },
  { id: 4, title: "Business License", description: "Company registration (if applicable)", status: "pending" },
];

const documents = [
  { id: 1, name: "Aadhaar Card", type: "Identity", status: "verified", uploadedAt: "2026-02-10" },
  { id: 2, name: "PAN Card", type: "Identity", status: "verified", uploadedAt: "2026-02-10" },
  { id: 3, name: "Electricity Bill", type: "Address", status: "pending", uploadedAt: "2026-02-25" },
];

const reviewerMessages = [
  { id: 1, from: "Compliance Team", message: "Your identity documents have been verified successfully.", time: "2 days ago", type: "success" },
  { id: 2, from: "Compliance Team", message: "Please upload a clearer copy of your electricity bill. The current document is partially illegible.", time: "1 day ago", type: "action" },
];

const KYC = () => {
  const [uploading, setUploading] = useState(false);

  const completedSteps = verificationSteps.filter(s => s.status === "completed").length;
  const progress = (completedSteps / verificationSteps.length) * 100;

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
                background: "linear-gradient(135deg, hsl(142 72% 35% / 0.9), hsl(217 91% 50% / 0.75), hsl(142 72% 40% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <ShieldCheck className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Identity Verification</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    KYC & Verification
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Complete your verification to unlock all platform features and ensure regulatory compliance.
                  </p>
                </div>
                <div className="text-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                      <circle 
                        cx="40" cy="40" r="36" 
                        stroke="white" 
                        strokeWidth="6" 
                        fill="none"
                        strokeDasharray={`${progress * 2.26} 226`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-2">Verification Progress</p>
                </div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Verification Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="lg:col-span-2 bg-card rounded-xl p-6 border border-border"
              >
                <h3 className="font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Verification Steps
                </h3>

                <div className="space-y-4">
                  {verificationSteps.map((step, i) => {
                    const isCompleted = step.status === "completed";
                    const isInProgress = step.status === "in-progress";
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isCompleted ? "bg-primary/5 border-primary/20" :
                          isInProgress ? "bg-saffron/5 border-saffron/20" :
                          "bg-muted/30 border-border"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? "bg-primary text-primary-foreground" :
                          isInProgress ? "bg-saffron text-white" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> :
                           isInProgress ? <Clock className="w-5 h-5" /> :
                           <span className="text-sm font-bold">{step.id}</span>}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{step.title}</h4>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          isCompleted ? "bg-primary/10 text-primary" :
                          isInProgress ? "bg-saffron/10 text-saffron" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {step.status.replace("-", " ")}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Status Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Verification Status
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">Identity</span>
                      </div>
                      <span className="text-xs font-medium text-primary flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-saffron/5 border border-saffron/10">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-saffron" />
                        <span className="text-sm text-foreground">Address</span>
                      </div>
                      <span className="text-xs font-medium text-saffron flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Business</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Not Started</span>
                    </div>
                  </div>
                </div>

                {/* Compliance Alerts */}
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-saffron" /> Action Required
                  </h3>
                  <div className="rounded-lg bg-saffron/5 border border-saffron/20 p-4">
                    <p className="text-sm text-foreground mb-2">Re-upload Address Proof</p>
                    <p className="text-xs text-muted-foreground mb-3">Your electricity bill document needs to be clearer.</p>
                    <Button size="sm" className="w-full text-xs" onClick={() => toast.info("Document upload dialog coming soon")}>
                      <Upload className="w-3 h-3 mr-1" /> Upload New Document
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Documents & Messages */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Uploaded Documents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl p-5 border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Uploaded Documents
                  </h3>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info("Document upload dialog coming soon")}>
                    <Upload className="w-3 h-3 mr-1" /> Upload
                  </Button>
                </div>

                <div className="space-y-3">
                  {documents.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type} • {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          doc.status === "verified" ? "bg-primary/10 text-primary" : "bg-saffron/10 text-saffron"
                        }`}>
                          {doc.status}
                        </span>
                        {doc.status === "pending" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info(`Re-validating ${doc.name}...`)}>
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Reviewer Messages */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-card rounded-xl p-5 border border-border"
              >
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> Reviewer Messages
                </h3>

                <div className="space-y-3">
                  {reviewerMessages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className={`p-4 rounded-lg border ${
                        msg.type === "success" ? "bg-primary/5 border-primary/10" : "bg-saffron/5 border-saffron/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-foreground">{msg.from}</span>
                        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{msg.message}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default KYC;

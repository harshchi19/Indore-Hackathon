import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LoadingSpinner, ErrorCard } from "@/components/ui/ApiStates";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plug, Battery, Signal, Clock, RefreshCw, AlertTriangle, Plus, MapPin, CheckCircle, WifiOff, Zap, Activity } from "lucide-react";
import { useState, useMemo } from "react";
import { useMeters } from "@/hooks/useMeters";

const SmartMeter = () => {
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);

  const { data: readingsRes, isLoading, error, refetch } = useMeters({ limit: 50 });

  // Group readings by device to build device list
  const devices = useMemo(() => {
    if (!readingsRes?.items?.length) {
      return [
        { id: "SM-001", location: "Unit A, Rajasthan", status: "online", battery: 92, signal: 98, lastSync: "2 min ago", readings: 0, anomalies: 0 },
        { id: "SM-002", location: "Unit B, Maharashtra", status: "online", battery: 78, signal: 87, lastSync: "5 min ago", readings: 0, anomalies: 0 },
      ];
    }
    const deviceMap = new Map<string, { readings: number; anomalies: number; lastTime: string }>();
    readingsRes.items.forEach((r) => {
      const existing = deviceMap.get(r.device_id) || { readings: 0, anomalies: 0, lastTime: r.timestamp };
      existing.readings++;
      if (r.status === "anomaly") existing.anomalies++;
      if (r.timestamp > existing.lastTime) existing.lastTime = r.timestamp;
      deviceMap.set(r.device_id, existing);
    });
    const locations = ["Unit A, Rajasthan", "Unit B, Maharashtra", "Unit C, Kerala", "Unit D, Delhi", "Unit E, Tamil Nadu"];
    return Array.from(deviceMap.entries()).map(([deviceId, info], idx) => ({
      id: deviceId,
      location: locations[idx % locations.length],
      status: info.anomalies > 2 ? "offline" : "online",
      // Deterministic battery/signal from device ID hash
      battery: 70 + (deviceId.charCodeAt(deviceId.length - 1) % 25),
      signal: 80 + (deviceId.charCodeAt(deviceId.length - 2 < 0 ? 0 : deviceId.length - 2) % 20),
      lastSync: `${Math.floor((Date.now() - new Date(info.lastTime).getTime()) / 60000)} min ago`,
      readings: info.readings,
      anomalies: info.anomalies,
    }));
  }, [readingsRes]);

  const recentReadings = useMemo(() => {
    if (!readingsRes?.items?.length) return [];
    return readingsRes.items.slice(0, 5).map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString("en-IN"),
      deviceId: r.device_id,
      value: `${r.reading_kwh.toFixed(1)} kWh`,
      type: "production",
    }));
  }, [readingsRes]);

  const anomalyAlerts = useMemo(() => {
    if (!readingsRes?.items?.length) return [];
    return readingsRes.items
      .filter((r) => r.status === "anomaly")
      .slice(0, 5)
      .map((r, idx) => ({
        id: idx + 1,
        deviceId: r.device_id,
        type: r.anomaly_reason || "Unusual Reading",
        severity: idx === 0 ? "high" : "medium",
        time: new Date(r.timestamp).toLocaleTimeString("en-IN"),
        description: r.anomaly_reason || "Anomalous reading detected",
      }));
  }, [readingsRes]);

  const handleSync = (deviceId: string) => {
    setSyncingDevice(deviceId);
    setTimeout(() => setSyncingDevice(null), 2000);
  };

  if (isLoading) {
    return <AppLayout><PageTransition><LoadingSpinner message="Loading smart meter data..." /></PageTransition></AppLayout>;
  }

  if (error && !readingsRes) {
    return <AppLayout><PageTransition><ErrorCard message="Failed to load meter data" onRetry={() => refetch()} /></PageTransition></AppLayout>;
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
                background: "linear-gradient(135deg, hsl(217 91% 50% / 0.9), hsl(142 72% 35% / 0.75), hsl(217 91% 60% / 0.5))"
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Plug className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">IoT Smart Meters</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    Smart Meter Dashboard
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    View and sync IoT smart meter devices. Monitor readings and detect anomalies in real-time.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={5} />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Total Devices</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">
                      <AnimatedCounter end={4} />
                    </p>
                    <p className="text-[11px] text-white/60 mt-1">Online</p>
                  </div>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <Plus className="w-4 h-4 mr-2" /> Add Device
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats Strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { label: "Total Readings", value: "6,770", icon: Activity, gradient: "from-primary/20 to-primary/5" },
                { label: "Avg Battery", value: "66%", icon: Battery, gradient: "from-accent/20 to-accent/5" },
                { label: "Avg Signal", value: "70%", icon: Signal, gradient: "from-primary/20 to-accent/5" },
                { label: "Anomalies", value: "4", icon: AlertTriangle, gradient: "from-destructive/20 to-destructive/5" },
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
              {/* Devices List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 bg-card rounded-xl p-5 border border-border"
              >
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Plug className="w-4 h-4 text-primary" /> Device List
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="pb-3 font-medium">Device ID</th>
                        <th className="pb-3 font-medium">Location</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Battery</th>
                        <th className="pb-3 font-medium">Signal</th>
                        <th className="pb-3 font-medium">Last Sync</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((device, i) => (
                        <motion.tr
                          key={device.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.05 }}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-3 font-mono text-foreground">{device.id}</td>
                          <td className="py-3 text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {device.location}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              device.status === "online" ? "bg-primary/10 text-primary" :
                              device.status === "offline" ? "bg-destructive/10 text-destructive" :
                              "bg-saffron/10 text-saffron"
                            }`}>
                              {device.status === "online" ? <CheckCircle className="w-3 h-3" /> :
                               device.status === "offline" ? <WifiOff className="w-3 h-3" /> :
                               <RefreshCw className="w-3 h-3 animate-spin" />}
                              {device.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${device.battery > 50 ? "bg-primary" : device.battery > 20 ? "bg-saffron" : "bg-destructive"}`}
                                  style={{ width: `${device.battery}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{device.battery}%</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Signal className={`w-3 h-3 ${device.signal > 80 ? "text-primary" : device.signal > 50 ? "text-saffron" : "text-destructive"}`} />
                              <span className="text-xs text-muted-foreground">{device.signal}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3 inline mr-1" />{device.lastSync}
                          </td>
                          <td className="py-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-7"
                              onClick={() => handleSync(device.id)}
                              disabled={syncingDevice === device.id || device.status === "offline"}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${syncingDevice === device.id ? "animate-spin" : ""}`} />
                              {syncingDevice === device.id ? "Syncing..." : "Sync"}
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Right Panel */}
              <div className="space-y-6">
                {/* Anomaly Alerts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" /> Anomaly Alerts
                  </h3>
                  <div className="space-y-3">
                    {anomalyAlerts.map((alert, i) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.08 }}
                        className={`rounded-lg p-3 border ${
                          alert.severity === "high" ? "bg-destructive/5 border-destructive/20" : "bg-saffron/5 border-saffron/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold ${alert.severity === "high" ? "text-destructive" : "text-saffron"}`}>
                            {alert.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.deviceId}: {alert.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Real-time Sync Logs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Real-time Readings
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {recentReadings.map((reading, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-border/50 last:border-0">
                        <span className="font-mono text-muted-foreground">{reading.time}</span>
                        <span className="text-foreground">{reading.deviceId}</span>
                        <span className="font-semibold text-primary">{reading.value}</span>
                      </div>
                    ))}
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

export default SmartMeter;

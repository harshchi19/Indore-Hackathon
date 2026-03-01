import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Network, Users, Factory, FileText, ShoppingCart, Award, Zap,
  ZoomIn, ZoomOut, Maximize2, Sun, Wind, Droplets, Leaf,
  TrendingUp, Sparkles, BarChart3
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";
import { graphService, GraphNode, GraphEdge } from "@/services/graphService";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import ForceGraph2D from "react-force-graph-2d";

// Colors for different node types
const nodeColors: Record<string, string> = {
  User: "#22c55e",
  Producer: "#f59e0b",
  Listing: "#3b82f6",
  EnergyListing: "#3b82f6",
  Contract: "#8b5cf6",
  Certificate: "#ec4899",
  Node: "#6b7280",
};

// Pre-built visualizations - user-friendly names and descriptions
const visualizations = [
  {
    id: "complete-network",
    name: "Complete Energy Network",
    description: "See how users, producers, and certificates are connected",
    icon: Network,
    color: "from-violet-500 to-purple-600",
    query: `MATCH (u:User)-[r1:HAS_CONTRACT]->(p:Producer)
MATCH (u)-[r2:OWNS_CERTIFICATE]->(c:Certificate)
MATCH (p)-[r3:OFFERS]->(l:EnergyListing)
RETURN u, r1, p, r2, c, r3, l
LIMIT 30`,
  },
  {
    id: "solar-network",
    name: "Solar Energy Network",
    description: "All solar energy producers and their offerings",
    icon: Sun,
    color: "from-amber-500 to-yellow-500",
    query: "MATCH (p:Producer {energy_type: 'solar'})-[r:OFFERS]->(l:EnergyListing) RETURN p, r, l",
  },
  {
    id: "wind-network",
    name: "Wind Energy Network",
    description: "Wind power producers and energy listings",
    icon: Wind,
    color: "from-sky-500 to-blue-600",
    query: "MATCH (p:Producer {energy_type: 'wind'})-[r:OFFERS]->(l:EnergyListing) RETURN p, r, l",
  },
  {
    id: "hydro-network",
    name: "Hydro Energy Network",
    description: "Hydropower stations and their energy offerings",
    icon: Droplets,
    color: "from-cyan-500 to-teal-600",
    query: "MATCH (p:Producer {energy_type: 'hydro'})-[r:OFFERS]->(l:EnergyListing) RETURN p, r, l",
  },
  {
    id: "top-producers",
    name: "Top Energy Producers",
    description: "Most active producers with highest contracts",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-600",
    query: "MATCH (u:User)-[r:HAS_CONTRACT]->(p:Producer) WITH p, count(r) as contracts MATCH (p)-[o:OFFERS]->(l:EnergyListing) RETURN p, o, l ORDER BY contracts DESC LIMIT 20",
  },
  {
    id: "certificate-holders",
    name: "Green Certificate Holders",
    description: "Users with renewable energy certificates",
    icon: Award,
    color: "from-pink-500 to-rose-600",
    query: "MATCH (u:User)-[r:OWNS_CERTIFICATE]->(c:Certificate) RETURN u, r, c LIMIT 30",
  },
  {
    id: "all-users",
    name: "Active Users Network",
    description: "All platform users and their connections",
    icon: Users,
    color: "from-indigo-500 to-violet-600",
    query: "MATCH (u:User)-[r]->(n) RETURN u, r, n LIMIT 40",
  },
];

interface ForceGraphNode {
  id: string;
  label: string;
  name: string;
  color: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface ForceGraphLink {
  source: string;
  target: string;
  type: string;
}

const NetworkInsights = () => {
  const [selectedViz, setSelectedViz] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: ForceGraphNode[]; links: ForceGraphLink[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<ForceGraphNode | null>(null);
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 550 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width - 2, height: 550 });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fetch graph stats
  const { data: statsData } = useQuery({
    queryKey: ["graph-stats"],
    queryFn: () => graphService.getStats(),
  });

  // Run query mutation
  const queryMutation = useMutation({
    mutationFn: (q: string) => graphService.runQuery(q),
    onSuccess: (data) => {
      // Transform data for force graph
      const nodes: ForceGraphNode[] = data.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        name: n.properties?.name || n.properties?.full_name || n.properties?.title || n.properties?.energy_source || n.id.slice(-8),
        color: nodeColors[n.label] || nodeColors.Node,
        properties: n.properties,
      }));

      const links: ForceGraphLink[] = data.edges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
      }));

      setGraphData({ nodes, links });
      setSelectedNode(null);
      
      toast.success(`Loaded ${nodes.length} entities with ${links.length} connections`);
      
      // Center the graph after data loads
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(400, 50);
        }
      }, 500);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to load visualization");
    },
  });

  const handleSelectVisualization = (viz: typeof visualizations[0]) => {
    setSelectedViz(viz.id);
    queryMutation.mutate(viz.query);
  };

  const handleNodeClick = useCallback((node: ForceGraphNode) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500);
      graphRef.current.zoom(2, 500);
    }
  }, []);

  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.5, 300);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.5, 300);
    }
  };

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  const stats = statsData?.stats;
  const neo4jUnavailable = statsData?.status === "unavailable";
  const activeViz = visualizations.find(v => v.id === selectedViz);

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-4 lg:p-6 space-y-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-4 lg:p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20" />
              <div className="absolute inset-0 grain opacity-20" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Network className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl lg:text-2xl font-heading font-bold text-white">Energy Network Insights</h1>
                    <p className="text-xs lg:text-sm text-white/70 mt-1">Explore how energy flows across the GreenGrid platform</p>
                  </div>
                </div>
                {stats && (
                  <div className="flex gap-4 lg:gap-6 text-center">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <Users className="w-4 h-4 text-green-400" />
                      <div className="text-left">
                        <p className="text-lg font-bold text-white">{stats.total_users || 0}</p>
                        <p className="text-[10px] text-white/60">Users</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <Factory className="w-4 h-4 text-amber-400" />
                      <div className="text-left">
                        <p className="text-lg font-bold text-white">{stats.total_producers || 0}</p>
                        <p className="text-[10px] text-white/60">Producers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <div className="text-left">
                        <p className="text-lg font-bold text-white">{stats.total_listings || 0}</p>
                        <p className="text-[10px] text-white/60">Listings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <FileText className="w-4 h-4 text-violet-400" />
                      <div className="text-left">
                        <p className="text-lg font-bold text-white">{stats.total_contracts || 0}</p>
                        <p className="text-[10px] text-white/60">Contracts</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Neo4j unavailable banner */}
            {neo4jUnavailable && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm">
                <span className="text-base">⚠️</span>
                <span>
                  <strong>Graph database is paused.</strong> The Neo4j Aura free tier auto-pauses after inactivity.
                  Resume it from the{" "}
                  <a href="https://console.neo4j.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">
                    Aura console
                  </a>
                  , then restart the backend. Live visualizations are unavailable until it reconnects.
                </span>
              </div>
            )}

            {/* Visualization Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-medium text-foreground">Choose a Visualization</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                {visualizations.map((viz, i) => {
                  const Icon = viz.icon;
                  const isActive = selectedViz === viz.id;
                  const isLoading = queryMutation.isPending && selectedViz === viz.id;
                  
                  return (
                    <motion.button
                      key={viz.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => handleSelectVisualization(viz)}
                      disabled={queryMutation.isPending}
                      className={`
                        relative group p-3 rounded-xl border transition-all text-left
                        ${isActive 
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                          : "border-border bg-card/50 hover:bg-card hover:border-primary/50"
                        }
                        ${queryMutation.isPending && !isActive ? "opacity-50" : ""}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg bg-gradient-to-br ${viz.color} 
                        flex items-center justify-center mb-2 shadow-lg
                        ${isLoading ? "animate-pulse" : ""}
                      `}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs font-medium text-foreground leading-tight">{viz.name}</p>
                      {isActive && (
                        <motion.div 
                          layoutId="activeIndicator"
                          className="absolute inset-0 border-2 border-primary rounded-xl"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-4 gap-4">
              {/* Left Panel - Active Viz Info & Node Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-1 space-y-4"
              >
                {/* Active Visualization Info */}
                {activeViz && (
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <activeViz.icon className="w-4 h-4" style={{ color: activeViz.color.includes("amber") ? "#f59e0b" : "#8b5cf6" }} />
                        Current View
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm font-medium">{activeViz.name}</p>
                      <p className="text-xs text-muted-foreground">{activeViz.description}</p>
                      <div className="flex gap-2 pt-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {graphData.nodes.length} entities
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {graphData.links.length} connections
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Legend */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      Network Legend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { label: "User", color: nodeColors.User, icon: Users },
                        { label: "Producer", color: nodeColors.Producer, icon: Factory },
                        { label: "Listing", color: nodeColors.Listing, icon: ShoppingCart },
                        { label: "Contract", color: nodeColors.Contract, icon: FileText },
                        { label: "Certificate", color: nodeColors.Certificate, icon: Award },
                      ].map(({ label, color, icon: Icon }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full flex items-center justify-center" 
                            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                          >
                            <span className="text-[8px] text-white font-bold">{label[0]}</span>
                          </div>
                          <Icon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Node Details */}
                <AnimatePresence>
                  {selectedNode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <Card className="bg-card/80 backdrop-blur-sm border border-primary/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                            {selectedNode.label} Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm font-medium">{selectedNode.name}</p>
                          <div className="space-y-1 text-xs text-muted-foreground max-h-40 overflow-y-auto">
                            {Object.entries(selectedNode.properties || {}).slice(0, 8).map(([key, value]) => (
                              <div key={key} className="flex justify-between gap-2 py-1 border-b border-border/50">
                                <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                                <span className="truncate text-right max-w-[120px]">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-2 text-xs"
                            onClick={() => setSelectedNode(null)}
                          >
                            Clear Selection
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Graph Visualization */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-3"
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Network className="w-4 h-4 text-blue-500" />
                        Network Visualization
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handleZoomIn} title="Zoom In">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handleZoomOut} title="Zoom Out">
                          <ZoomOut className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handleFitView} title="Fit to View">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      ref={containerRef}
                      className="relative rounded-xl overflow-hidden border border-border"
                      style={{ height: "550px", background: "#0f172a" }}
                    >
                      {graphData.nodes.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                            <Network className="w-10 h-10 opacity-40" />
                          </div>
                          <p className="text-sm font-medium">Select a visualization above</p>
                          <p className="text-xs mt-1 opacity-60">Click any card to explore energy network connections</p>
                        </div>
                      ) : (
                        <ForceGraph2D
                          ref={graphRef}
                          graphData={graphData}
                          width={dimensions.width}
                          height={550}
                          backgroundColor="#0f172a"
                          nodeLabel={(node: any) => `${node.label}: ${node.name}`}
                          nodeColor={(node: any) => node.color}
                          nodeRelSize={8}
                          nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const label = node.label?.charAt(0) || "?";
                            const fontSize = 12 / globalScale;
                            const nodeR = 8;
                            
                            // Draw glow
                            ctx.shadowColor = node.color;
                            ctx.shadowBlur = 15;
                            
                            // Draw node circle
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI);
                            ctx.fillStyle = node.color;
                            ctx.fill();
                            ctx.shadowBlur = 0;
                            
                            // Draw border
                            ctx.strokeStyle = selectedNode?.id === node.id ? "#fff" : "rgba(255,255,255,0.3)";
                            ctx.lineWidth = selectedNode?.id === node.id ? 3 / globalScale : 1.5 / globalScale;
                            ctx.stroke();
                            
                            // Draw label inside node
                            ctx.fillStyle = "#fff";
                            ctx.font = `bold ${fontSize}px Sans-Serif`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillText(label, node.x, node.y);
                            
                            // Draw name below node
                            const nameLabel = String(node.name || "").slice(0, 12);
                            ctx.fillStyle = "rgba(255,255,255,0.8)";
                            ctx.font = `${fontSize * 0.8}px Sans-Serif`;
                            ctx.fillText(nameLabel, node.x, node.y + nodeR + fontSize);
                          }}
                          linkColor={() => "rgba(100, 116, 139, 0.5)"}
                          linkWidth={1.5}
                          linkDirectionalArrowLength={6}
                          linkDirectionalArrowRelPos={1}
                          linkLabel={(link: any) => link.type}
                          linkCanvasObjectMode={() => "after"}
                          linkCanvasObject={(link: any, ctx, globalScale) => {
                            const fontSize = 9 / globalScale;
                            const midX = (link.source.x + link.target.x) / 2;
                            const midY = (link.source.y + link.target.y) / 2;
                            
                            ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
                            ctx.font = `${fontSize}px Sans-Serif`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillText(link.type.replace(/_/g, " "), midX, midY - 5 / globalScale);
                          }}
                          onNodeClick={handleNodeClick}
                          onNodeDragEnd={(node: any) => {
                            node.fx = node.x;
                            node.fy = node.y;
                          }}
                          cooldownTicks={100}
                          enableNodeDrag={true}
                          enableZoomInteraction={true}
                          enablePanInteraction={true}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      💡 Drag nodes to reposition • Scroll to zoom • Click a node for details
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default NetworkInsights;

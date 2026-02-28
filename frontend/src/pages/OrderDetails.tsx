import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, ArrowLeft, CheckCircle, Clock, Download, Copy, 
  MapPin, Calendar, User, Building, FileText, ExternalLink,
  Shield, TrendingUp, Leaf, AlertCircle
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";
import { useNavigate, useParams } from "react-router-dom";

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  // Demo order data
  const order = {
    id: orderId || "ORD-2024-7821",
    status: "completed",
    type: "buy",
    energyType: "Solar",
    quantity: 450,
    pricePerUnit: 4.25,
    totalAmount: 1912.5,
    platformFee: 38.25,
    netAmount: 1950.75,
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:32:15Z",
    producer: {
      name: "SunPower Solar Farm",
      id: "PROD-001",
      location: "Rajasthan, India",
      rating: 4.9,
      verified: true,
    },
    consumer: {
      name: "Tech Park Industries",
      id: "CON-042",
      location: "Mumbai, India",
    },
    blockchain: {
      txHash: "0x7f8a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
      blockNumber: 18547823,
      gasUsed: "0.0023 ETH",
      network: "Polygon",
    },
    certificates: [
      { id: "REC-2024-1234", type: "REC", status: "issued" },
      { id: "GO-2024-5678", type: "Guarantee of Origin", status: "issued" },
    ],
    timeline: [
      { time: "10:30:00", event: "Order Created", status: "completed" },
      { time: "10:30:05", event: "Payment Verified", status: "completed" },
      { time: "10:30:12", event: "Producer Confirmed", status: "completed" },
      { time: "10:31:45", event: "Energy Transfer Started", status: "completed" },
      { time: "10:32:15", event: "Transfer Complete", status: "completed" },
      { time: "10:32:20", event: "Certificates Issued", status: "completed" },
    ],
  };

  const statusColors: Record<string, string> = {
    completed: "bg-primary/10 text-primary border-primary/20",
    pending: "bg-saffron/10 text-saffron border-saffron/20",
    processing: "bg-accent/10 text-accent border-accent/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-heading font-bold text-foreground">{order.id}</h1>
                  <Badge className={statusColors[order.status]}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Invoice
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Summary */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Energy Type</p>
                        <p className="text-xl font-semibold mt-1">{order.energyType}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="text-xl font-semibold mt-1">{order.quantity} kWh</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Price per kWh</p>
                        <p className="text-xl font-semibold mt-1">₹{order.pricePerUnit}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-semibold text-primary mt-1">₹{order.netAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-muted/20 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{order.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee (2%)</span>
                        <span>₹{order.platformFee.toLocaleString()}</span>
                      </div>
                      <hr className="border-border" />
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-primary">₹{order.netAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Parties */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Producer</p>
                          <p className="font-semibold mt-1">{order.producer.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {order.producer.location}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {order.producer.verified && (
                              <Badge variant="outline" className="text-xs bg-primary/5 text-primary">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              ⭐ {order.producer.rating}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Consumer</p>
                          <p className="font-semibold mt-1">{order.consumer.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {order.consumer.location}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">ID: {order.consumer.id}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Blockchain Details */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      Blockchain Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Transaction Hash</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-background/50 px-2 py-1 rounded">
                            {order.blockchain.txHash.slice(0, 20)}...{order.blockchain.txHash.slice(-8)}
                          </code>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(order.blockchain.txHash)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Block Number</span>
                        <span className="text-sm font-mono">{order.blockchain.blockNumber.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Network</span>
                        <Badge variant="outline">{order.blockchain.network}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Gas Used</span>
                        <span className="text-sm">{order.blockchain.gasUsed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Certificates */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-primary" />
                      Green Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.certificates.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{cert.type}</p>
                              <p className="text-sm text-muted-foreground">{cert.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Issued
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline Sidebar */}
              <div className="space-y-6">
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative space-y-0">
                      {order.timeline.map((event, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex gap-4 pb-6 last:pb-0"
                        >
                          {/* Line */}
                          {index < order.timeline.length - 1 && (
                            <div className="absolute left-[11px] top-6 w-0.5 h-full bg-primary/20" />
                          )}
                          
                          {/* Dot */}
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 z-10">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{event.event}</p>
                            <p className="text-xs text-muted-foreground">{event.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Carbon Impact */}
                <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Leaf className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Carbon Impact</h3>
                      <p className="text-3xl font-bold text-primary mb-2">225 kg</p>
                      <p className="text-sm text-muted-foreground">CO₂ emissions avoided</p>
                      <div className="mt-4 p-3 rounded-lg bg-background/50">
                        <p className="text-xs text-muted-foreground">
                          Equivalent to planting <span className="font-semibold text-primary">11 trees</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardContent className="pt-6 space-y-3">
                    <Button className="w-full" variant="outline">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Report Issue
                    </Button>
                    <Button className="w-full" variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Trade Again
                    </Button>
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

export default OrderDetails;

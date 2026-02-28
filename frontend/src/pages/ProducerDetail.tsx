import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, ArrowLeft, Sun, Wind, Droplets, Leaf, Star, Shield, 
  MapPin, Calendar, Clock, Award, TrendingUp, Users, CheckCircle,
  MessageSquare, FileText, Building, Globe, Mail, Phone, ExternalLink
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";
import { useNavigate, useParams } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const ProducerDetail = () => {
  const navigate = useNavigate();
  const { producerId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  // Demo producer data
  const producer = {
    id: producerId || "PROD-001",
    name: "SunPower Solar Farm",
    tagline: "Harvesting Clean Energy Since 2018",
    logo: "☀️",
    verified: true,
    premium: true,
    rating: 4.9,
    totalReviews: 847,
    location: "Jodhpur, Rajasthan",
    country: "India",
    established: "2018",
    energyTypes: ["solar", "wind"],
    totalCapacity: 15000, // kWh/day
    totalDelivered: 2500000, // kWh all time
    activeContracts: 42,
    co2Saved: 1250, // tons
    description: "SunPower Solar Farm is a leading renewable energy producer in Rajasthan, operating one of the largest solar installations in Western India. We are committed to providing clean, affordable, and reliable solar energy to consumers and businesses.",
    contact: {
      email: "contact@sunpowerfarm.in",
      phone: "+91 98765 43210",
      website: "www.sunpowerfarm.in",
    },
    certifications: [
      { name: "ISO 14001", year: "2020" },
      { name: "Green-e Certified", year: "2021" },
      { name: "REC Certified", year: "2019" },
      { name: "MNRE Approved", year: "2018" },
    ],
    stats: {
      uptime: 99.7,
      fulfillmentRate: 99.2,
      avgResponseTime: "< 15 min",
      repeatCustomers: 78,
    },
    listings: [
      { id: 1, type: "Solar", capacity: 500, price: 4.25, availability: "24/7" },
      { id: 2, type: "Solar", capacity: 1000, price: 4.10, availability: "Peak Hours" },
      { id: 3, type: "Wind", capacity: 750, price: 4.50, availability: "24/7" },
    ],
  };

  const productionData = [
    { month: "Jan", production: 450000, target: 400000 },
    { month: "Feb", production: 480000, target: 420000 },
    { month: "Mar", production: 520000, target: 450000 },
    { month: "Apr", production: 580000, target: 500000 },
    { month: "May", production: 620000, target: 550000 },
    { month: "Jun", production: 650000, target: 600000 },
  ];

  const reviews = [
    { id: 1, user: "TechCorp Industries", rating: 5, comment: "Excellent service and consistent energy delivery. Highly recommend!", date: "2024-01-10" },
    { id: 2, user: "Green Buildings Ltd", rating: 5, comment: "Very reliable producer. Great communication and on-time delivery.", date: "2024-01-08" },
    { id: 3, user: "EcoHome Apartments", rating: 4, comment: "Good quality solar energy. Competitive pricing.", date: "2024-01-05" },
  ];

  const energyTypeIcons: Record<string, { icon: React.ComponentType<{className?: string}>, color: string }> = {
    solar: { icon: Sun, color: "text-saffron" },
    wind: { icon: Wind, color: "text-accent" },
    hydro: { icon: Droplets, color: "text-blue-400" },
    biogas: { icon: Leaf, color: "text-primary" },
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Producers
            </Button>

            {/* Header Card */}
            <Card className="bg-card/80 backdrop-blur-sm border-border overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-primary/30 via-accent/20 to-saffron/30" />
              <CardContent className="relative pt-0 pb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
                  {/* Logo */}
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-saffron/20 to-primary/20 border-4 border-background flex items-center justify-center text-5xl shadow-lg">
                    {producer.logo}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 pt-2 md:pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-heading font-bold">{producer.name}</h1>
                      {producer.verified && (
                        <Badge className="bg-primary/10 text-primary">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {producer.premium && (
                        <Badge className="bg-saffron/10 text-saffron">
                          <Award className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1">{producer.tagline}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {producer.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Since {producer.established}
                      </span>
                      <span className="flex items-center gap-1 text-saffron">
                        <Star className="w-3 h-3 fill-current" /> {producer.rating} ({producer.totalReviews} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    <Button>
                      <Zap className="w-4 h-4 mr-2" />
                      Buy Energy
                    </Button>
                  </div>
                </div>

                {/* Energy Types */}
                <div className="flex gap-2 mt-4">
                  {producer.energyTypes.map((type) => {
                    const EnergyIcon = energyTypeIcons[type]?.icon || Zap;
                    const color = energyTypeIcons[type]?.color || "text-primary";
                    return (
                      <Badge key={type} variant="outline" className="gap-1 capitalize">
                        <EnergyIcon className={`w-3 h-3 ${color}`} />
                        {type}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{(producer.totalCapacity / 1000).toFixed(0)}k</p>
                      <p className="text-sm text-muted-foreground">kWh/Day Capacity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{(producer.totalDelivered / 1000000).toFixed(1)}M</p>
                      <p className="text-sm text-muted-foreground">kWh Delivered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-saffron" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{producer.activeContracts}</p>
                      <p className="text-sm text-muted-foreground">Active Contracts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{producer.co2Saved}</p>
                      <p className="text-sm text-muted-foreground">Tons CO₂ Saved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="listings">Listings</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* About */}
                  <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{producer.description}</p>
                      
                      <div className="mt-6 grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/30">
                          <p className="text-sm text-muted-foreground">Uptime</p>
                          <p className="text-xl font-bold text-primary">{producer.stats.uptime}%</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/30">
                          <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
                          <p className="text-xl font-bold text-primary">{producer.stats.fulfillmentRate}%</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/30">
                          <p className="text-sm text-muted-foreground">Avg Response Time</p>
                          <p className="text-xl font-bold">{producer.stats.avgResponseTime}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/30">
                          <p className="text-sm text-muted-foreground">Repeat Customers</p>
                          <p className="text-xl font-bold">{producer.stats.repeatCustomers}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact */}
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{producer.contact.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{producer.contact.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Website</p>
                          <p className="text-sm font-medium">{producer.contact.website}</p>
                        </div>
                      </div>
                      <Button className="w-full mt-2" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Website
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Production Chart */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Production History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={productionData}>
                          <defs>
                            <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                          <Tooltip 
                            contentStyle={{ background: 'rgba(10,10,10,0.9)', border: '1px solid #333', borderRadius: '8px' }}
                            formatter={(value: number) => [`${(value/1000).toFixed(0)}k kWh`, 'Production']}
                          />
                          <Area type="monotone" dataKey="production" stroke="#22c55e" fillOpacity={1} fill="url(#colorProduction)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listings" className="mt-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {producer.listings.map((listing) => (
                    <Card key={listing.id} className="bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center">
                              <Sun className="w-5 h-5 text-saffron" />
                            </div>
                            <div>
                              <p className="font-semibold">{listing.type} Energy</p>
                              <p className="text-sm text-muted-foreground">{listing.availability}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-primary/5 text-primary">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacity</span>
                          <span className="font-medium">{listing.capacity} kWh/day</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-bold text-primary">₹{listing.price}/kWh</span>
                        </div>
                        <Button className="w-full mt-4" size="sm">
                          Buy Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Customer Reviews</CardTitle>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-saffron fill-current" />
                        <span className="text-xl font-bold">{producer.rating}</span>
                        <span className="text-muted-foreground">({producer.totalReviews} reviews)</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{review.user}</p>
                              <p className="text-xs text-muted-foreground">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-saffron fill-current' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications" className="mt-6">
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Certifications & Accreditations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {producer.certifications.map((cert) => (
                        <div key={cert.name} className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{cert.name}</p>
                            <p className="text-sm text-muted-foreground">Certified since {cert.year}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default ProducerDetail;

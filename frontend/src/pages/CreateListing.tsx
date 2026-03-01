import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, Sun, Wind, Droplets, Leaf, ArrowRight, ArrowLeft, Check, 
  MapPin, Calendar, Clock, DollarSign, TrendingUp, AlertCircle,
  Upload, Info, Sparkles
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";
import { useNavigate } from "react-router-dom";
import { useCreateListing } from "@/hooks/useListings";
import { useProducers } from "@/hooks/useProducers";
import type { EnergySource } from "@/types";

const CreateListing = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    energyType: "solar",
    capacity: 500,
    pricePerUnit: 4.5,
    minOrder: 100,
    maxOrder: 1000,
    availability: "24/7",
    location: "",
    description: "",
    startDate: "",
    endDate: "",
    autoRenew: true,
    instantDelivery: true,
    certifications: [] as string[],
  });

  const energyTypes = [
    { id: "solar", name: "Solar", icon: Sun, color: "text-saffron", bg: "bg-saffron/10" },
    { id: "wind", name: "Wind", icon: Wind, color: "text-accent", bg: "bg-accent/10" },
    { id: "hydro", name: "Hydro", icon: Droplets, color: "text-blue-400", bg: "bg-blue-400/10" },
    { id: "biogas", name: "Biogas", icon: Leaf, color: "text-primary", bg: "bg-primary/10" },
  ];

  const certifications = [
    { id: "rec", name: "REC Certified", desc: "Renewable Energy Certificate" },
    { id: "ggo", name: "G-GO Certified", desc: "Guarantee of Origin" },
    { id: "irec", name: "I-REC", desc: "International REC Standard" },
    { id: "green", name: "Green-e", desc: "Green-e Energy Certified" },
  ];

  const createMutation = useCreateListing();
  const { data: producersRes } = useProducers({ limit: 1 });
  const myProducerId = producersRes?.items?.[0]?.id;

  const handleSubmit = async () => {
    if (!myProducerId) {
      alert("You need to create a Producer profile before listing energy. Go to Marketplace → Become a Producer.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        producer_id: myProducerId,
        title: `${formData.energyType.charAt(0).toUpperCase() + formData.energyType.slice(1)} Energy - ${formData.capacity} kWh`,
        description: formData.description || undefined,
        energy_source: formData.energyType as EnergySource,
        quantity_kwh: formData.capacity,
        price_per_kwh: formData.pricePerUnit,
        min_purchase_kwh: formData.minOrder,
        available_until: formData.endDate || undefined,
      });
      navigate("/marketplace");
    } catch {
      // error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedRevenue = formData.capacity * formData.pricePerUnit * 30;

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">Create Energy Listing</h1>
                <p className="text-sm text-muted-foreground mt-1">List your renewable energy on the marketplace</p>
              </div>
              <Badge variant="outline" className="text-sm">
                Step {step} of 3
              </Badge>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div className="flex-1 h-1 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: step > s ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Energy Type & Capacity */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Energy Source</CardTitle>
                    <CardDescription>Select the type of renewable energy you're selling</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.energyType}
                      onValueChange={(value) => setFormData({ ...formData, energyType: value })}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {energyTypes.map((type) => (
                        <label
                          key={type.id}
                          className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.energyType === type.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={type.id} className="sr-only" />
                          <div className={`w-14 h-14 rounded-xl ${type.bg} flex items-center justify-center`}>
                            <type.icon className={`w-7 h-7 ${type.color}`} />
                          </div>
                          <span className="font-medium">{type.name}</span>
                          {formData.energyType === type.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </label>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Capacity & Availability</CardTitle>
                    <CardDescription>How much energy can you supply?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Daily Capacity (kWh)</label>
                        <span className="text-2xl font-bold text-primary">{formData.capacity} kWh</span>
                      </div>
                      <Slider
                        value={[formData.capacity]}
                        onValueChange={(value) => setFormData({ ...formData, capacity: value[0] })}
                        min={50}
                        max={5000}
                        step={50}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>50 kWh</span>
                        <span>5,000 kWh</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Minimum Order (kWh)</label>
                        <Input
                          type="number"
                          value={formData.minOrder}
                          onChange={(e) => setFormData({ ...formData, minOrder: parseInt(e.target.value) || 0 })}
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Maximum Order (kWh)</label>
                        <Input
                          type="number"
                          value={formData.maxOrder}
                          onChange={(e) => setFormData({ ...formData, maxOrder: parseInt(e.target.value) || 0 })}
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your facility location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="pl-10 bg-background/50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Pricing & Terms */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing</CardTitle>
                    <CardDescription>Set your energy price per unit</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Price per kWh</label>
                        <span className="text-2xl font-bold text-primary">₹{formData.pricePerUnit.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[formData.pricePerUnit * 100]}
                        onValueChange={(value) => setFormData({ ...formData, pricePerUnit: value[0] / 100 })}
                        min={200}
                        max={1000}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₹2.00</span>
                        <span>Market Avg: ₹4.50</span>
                        <span>₹10.00</span>
                      </div>
                    </div>

                    {/* Revenue Estimate */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="font-medium">Estimated Monthly Revenue</span>
                      </div>
                      <p className="text-3xl font-bold text-primary">₹{estimatedRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on {formData.capacity} kWh/day × ₹{formData.pricePerUnit}/kWh × 30 days
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Contract Period</CardTitle>
                    <CardDescription>When will this listing be available?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Start Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="pl-10 bg-background/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">End Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="pl-10 bg-background/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Auto-Renew</p>
                          <p className="text-sm text-muted-foreground">Automatically renew listing when it expires</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.autoRenew}
                        onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Instant Delivery</p>
                          <p className="text-sm text-muted-foreground">Enable real-time energy transfer</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.instantDelivery}
                        onCheckedChange={(checked) => setFormData({ ...formData, instantDelivery: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Certifications & Review */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Certifications</CardTitle>
                    <CardDescription>Select applicable certifications for your energy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                      {certifications.map((cert) => (
                        <label
                          key={cert.id}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.certifications.includes(cert.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.certifications.includes(cert.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, certifications: [...formData.certifications, cert.id] });
                              } else {
                                setFormData({ ...formData, certifications: formData.certifications.filter(c => c !== cert.id) });
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            formData.certifications.includes(cert.id)
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}>
                            {formData.certifications.includes(cert.id) && (
                              <Check className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-xs text-muted-foreground">{cert.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Upload className="w-5 h-5" />
                        <div>
                          <p className="font-medium text-foreground">Upload Certificates</p>
                          <p className="text-sm">Drag & drop or click to upload certification documents</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Listing Summary</CardTitle>
                    <CardDescription>Review your listing details before publishing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-muted-foreground">Energy Type</span>
                          <span className="font-medium capitalize">{formData.energyType}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-muted-foreground">Daily Capacity</span>
                          <span className="font-medium">{formData.capacity} kWh</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-muted-foreground">Price/kWh</span>
                          <span className="font-medium text-primary">₹{formData.pricePerUnit.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-muted-foreground">Order Range</span>
                          <span className="font-medium">{formData.minOrder} - {formData.maxOrder} kWh</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-muted-foreground">Auto-Renew</span>
                          <span className="font-medium">{formData.autoRenew ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-muted-foreground">Instant Delivery</span>
                          <span className="font-medium">{formData.instantDelivery ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <TrendingUp className="w-4 h-4" />
                        Est. Monthly Revenue
                      </div>
                      <p className="text-3xl font-bold text-primary">₹{estimatedRevenue.toLocaleString()}</p>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-saffron/10 border border-saffron/20 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-saffron flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        By publishing, you agree to the GreenGrid Marketplace Terms and commit to delivering the specified energy capacity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} className="flex-1">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      Publish Listing
                      <Zap className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default CreateListing;

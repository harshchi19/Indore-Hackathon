import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, MapPin, Building2, Camera, Shield, Bell, 
  CreditCard, Key, Globe, Moon, Sun, Smartphone, Download, Trash2, 
  CheckCircle2, AlertCircle, Wallet
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";

const Profile = () => {
  const { user } = useAuth();

  const { data: dashboard } = useAnalytics();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "+91 98765 43210",
    location: "Mumbai, Maharashtra",
    company: "GreenTech Solutions",
    bio: "Renewable energy enthusiast and solar rooftop owner.",
    userType: "prosumer",
    kycStatus: "verified",
    joinedDate: "Jan 2024",
    tradingVolume: "0 kWh",
    carbonOffset: "0 tons CO₂",
  });

  // Populate profile from auth user + dashboard
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.full_name || prev.name,
        email: user.email || prev.email,
        userType: user.role || prev.userType,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (dashboard) {
      setProfile((prev) => ({
        ...prev,
        tradingVolume: `${dashboard.total_energy_kwh.toLocaleString()} kWh`,
        carbonOffset: `${(dashboard.total_co2_avoided_kg / 1000).toFixed(1)} tons CO₂`,
      }));
    }
  }, [dashboard]);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    priceAlerts: true,
    tradeConfirmations: true,
    weeklyDigest: true,
    marketingEmails: false,
  });

  const [preferences, setPreferences] = useState({
    darkMode: true,
    language: "en",
    currency: "INR",
    timezone: "Asia/Kolkata",
    twoFactorAuth: true,
  });

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">Profile & Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
              </div>
            </div>

            {/* Profile Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-primary/20">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-heading">
                          {profile.name ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-heading font-bold text-foreground">{profile.name}</h2>
                        {profile.kycStatus === "verified" && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {profile.userType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{profile.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{profile.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{profile.company}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-lg font-bold text-primary">{profile.tradingVolume}</p>
                        <p className="text-xs text-muted-foreground">Total Traded</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-accent/5 border border-accent/10">
                        <p className="text-lg font-bold text-accent">{profile.carbonOffset}</p>
                        <p className="text-xs text-muted-foreground">Carbon Offset</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Settings Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs defaultValue="account" className="space-y-4">
                <TabsList className="bg-card/80 border border-border">
                  <TabsTrigger value="account">
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="notifications">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="billing">
                    <Wallet className="w-4 h-4 mr-2" />
                    Billing
                  </TabsTrigger>
                </TabsList>

                {/* Account Tab */}
                <TabsContent value="account">
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                      <CardDescription>Update your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Full Name</label>
                          <Input
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone</label>
                          <Input
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Location</label>
                          <Input
                            value={profile.location}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Bio</label>
                          <Input
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            className="bg-background/50"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium mb-4">Preferences</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Language</label>
                            <select className="w-full h-10 px-3 rounded-md border border-border bg-background/50 text-sm">
                              <option value="en">English</option>
                              <option value="hi">Hindi</option>
                              <option value="mr">Marathi</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Currency</label>
                            <select className="w-full h-10 px-3 rounded-md border border-border bg-background/50 text-sm">
                              <option value="INR">INR (₹)</option>
                              <option value="USD">USD ($)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Timezone</label>
                            <select className="w-full h-10 px-3 rounded-md border border-border bg-background/50 text-sm">
                              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                              <option value="UTC">UTC</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button variant="outline">Cancel</Button>
                        <Button>Save Changes</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Security Settings</CardTitle>
                      <CardDescription>Manage your security preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Key className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Password</p>
                            <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Change</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.twoFactorAuth}
                          onCheckedChange={(checked) => setPreferences({ ...preferences, twoFactorAuth: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center">
                            <Download className="w-5 h-5 text-saffron" />
                          </div>
                          <div>
                            <p className="font-medium">Download Your Data</p>
                            <p className="text-sm text-muted-foreground">Get a copy of all your data</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-destructive">Delete Account</p>
                            <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Notification Preferences</CardTitle>
                      <CardDescription>Choose what notifications you receive</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { key: "emailAlerts", label: "Email Alerts", desc: "Get notified via email" },
                        { key: "smsAlerts", label: "SMS Alerts", desc: "Get notified via SMS" },
                        { key: "priceAlerts", label: "Price Alerts", desc: "When energy prices change significantly" },
                        { key: "tradeConfirmations", label: "Trade Confirmations", desc: "Confirmation for each trade" },
                        { key: "weeklyDigest", label: "Weekly Digest", desc: "Weekly summary of your activity" },
                        { key: "marketingEmails", label: "Marketing Emails", desc: "News and promotional content" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications]}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, [item.key]: checked })
                            }
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing">
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Billing & Payments</CardTitle>
                      <CardDescription>Manage your payment methods and billing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Payment Methods</h4>
                          <Button variant="outline" size="sm">Add New</Button>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-6 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">•••• •••• •••• 4242</p>
                                <p className="text-xs text-muted-foreground">Expires 12/25</p>
                              </div>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-primary/20">Default</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-6 rounded bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">UPI - rahul@okaxis</p>
                                <p className="text-xs text-muted-foreground">Verified</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">Set Default</Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border">
                        <h4 className="font-medium mb-4">Billing Address</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Street Address</label>
                            <Input defaultValue="123 Green Lane" className="bg-background/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">City</label>
                            <Input defaultValue="Mumbai" className="bg-background/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">State</label>
                            <Input defaultValue="Maharashtra" className="bg-background/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">PIN Code</label>
                            <Input defaultValue="400001" className="bg-background/50" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button>Save Billing Info</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Profile;

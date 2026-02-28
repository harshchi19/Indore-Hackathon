import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle, Search, MessageSquare, Mail, Phone, FileText,
  Zap, CreditCard, Shield, Leaf, Users, Settings, Book,
  ChevronRight, ExternalLink, Send, CheckCircle
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: "getting-started", name: "Getting Started", icon: Book, color: "text-primary" },
    { id: "trading", name: "Energy Trading", icon: Zap, color: "text-saffron" },
    { id: "payments", name: "Payments & Billing", icon: CreditCard, color: "text-accent" },
    { id: "security", name: "Security & Privacy", icon: Shield, color: "text-green-500" },
    { id: "certificates", name: "Green Certificates", icon: Leaf, color: "text-primary" },
    { id: "account", name: "Account Settings", icon: Settings, color: "text-muted-foreground" },
  ];

  const faqs = [
    {
      category: "getting-started",
      questions: [
        {
          q: "How do I create an account on GreenGrid?",
          a: "To create an account, click the 'Register' button on the landing page. You'll need to provide your email, create a password, and select whether you're a Consumer, Producer, or Prosumer. After verification, complete your profile and KYC for full access to the marketplace."
        },
        {
          q: "What is the difference between Consumer, Producer, and Prosumer?",
          a: "Consumers purchase renewable energy from the marketplace. Producers are energy generators (solar farms, wind farms, etc.) who sell energy. Prosumers both produce and consume energy - typically solar rooftop owners who sell excess energy and buy when needed."
        },
        {
          q: "How does peer-to-peer energy trading work?",
          a: "P2P energy trading allows you to buy energy directly from producers without intermediaries. Browse available listings, select your preferred producer based on price, location, and energy type, then complete the purchase. Smart contracts ensure secure, transparent transactions."
        },
      ]
    },
    {
      category: "trading",
      questions: [
        {
          q: "What types of renewable energy can I trade?",
          a: "GreenGrid supports Solar, Wind, Hydroelectric, and Biogas energy trading. Each listing specifies the energy source, allowing you to choose based on your sustainability preferences and pricing."
        },
        {
          q: "How are energy prices determined?",
          a: "Prices are set by producers based on market conditions, production costs, and demand. You can view real-time pricing trends on the dashboard. Premium certified energy may command higher prices due to verified sustainability credentials."
        },
        {
          q: "Can I set up recurring energy purchases?",
          a: "Yes! You can create long-term contracts with producers for consistent energy supply. Navigate to Contracts > Create New, set your terms (quantity, price, duration), and the producer will receive your offer for approval."
        },
        {
          q: "What happens if a producer cannot fulfill my order?",
          a: "Orders are protected by smart contracts. If a producer fails to deliver, you receive an automatic refund. Our dispute resolution system handles any issues, and producers face penalties for non-fulfillment to maintain marketplace integrity."
        },
      ]
    },
    {
      category: "payments",
      questions: [
        {
          q: "What payment methods are accepted?",
          a: "We accept bank transfers (UPI, NEFT, IMPS), credit/debit cards, and cryptocurrency (ETH, MATIC). Wallet balance can be topped up and used for instant purchases. All transactions are secured and encrypted."
        },
        {
          q: "How does the escrow system work?",
          a: "When you place an order, funds are held in escrow via smart contracts. Once energy delivery is confirmed through smart meter verification, funds are automatically released to the producer. This protects both parties."
        },
        {
          q: "Are there any platform fees?",
          a: "GreenGrid charges a 2% platform fee on successful transactions. This covers blockchain transaction costs, dispute resolution services, and platform maintenance. No hidden fees - the total is always shown before purchase."
        },
        {
          q: "How can I get a refund?",
          a: "Refunds are automatic for failed deliveries. For disputes, file a claim within 48 hours of the expected delivery. Our team reviews evidence from both parties and smart meter data to make fair decisions."
        },
      ]
    },
    {
      category: "security",
      questions: [
        {
          q: "How is my data protected?",
          a: "We use enterprise-grade encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Your personal information is never shared with third parties without consent. Smart meter data is anonymized for marketplace analytics."
        },
        {
          q: "What is KYC verification?",
          a: "Know Your Customer (KYC) verification confirms your identity for regulatory compliance. Upload government ID and address proof. Verification typically takes 24-48 hours. Required for transactions above ₹50,000."
        },
        {
          q: "How do I enable two-factor authentication?",
          a: "Go to Profile > Security > Two-Factor Authentication. You can use SMS codes, authenticator apps (Google Authenticator, Authy), or hardware keys. We strongly recommend enabling 2FA for account security."
        },
      ]
    },
    {
      category: "certificates",
      questions: [
        {
          q: "What are Renewable Energy Certificates (RECs)?",
          a: "RECs prove that energy was generated from renewable sources. Each REC represents 1 MWh of clean energy. They're automatically issued with purchases from certified producers and can be used for carbon offset reporting."
        },
        {
          q: "How do I claim carbon credits?",
          a: "Carbon credits are calculated based on your renewable energy consumption. Navigate to Carbon Credit > My Credits to view accumulated credits. You can retire them for ESG reporting or sell them on our carbon marketplace."
        },
        {
          q: "Are the certificates blockchain-verified?",
          a: "Yes! All certificates are minted as NFTs on the Polygon blockchain, ensuring immutability and verifiability. Each certificate has a unique hash that can be verified on-chain for auditing purposes."
        },
      ]
    },
    {
      category: "account",
      questions: [
        {
          q: "How do I update my profile information?",
          a: "Go to Profile > Account Settings to update your name, email, phone number, and preferences. Changes to verified information (like email) require re-verification for security."
        },
        {
          q: "How do I delete my account?",
          a: "Navigate to Profile > Account > Delete Account. Note that you must have zero wallet balance and no active contracts. Account deletion is permanent - all data will be removed within 30 days per our privacy policy."
        },
        {
          q: "Can I have multiple accounts?",
          a: "Each user is limited to one account per identity. Businesses can create organizational accounts with multiple team members. Contact support for enterprise accounts with role-based access control."
        },
      ]
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
               q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : faqs;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto"
              >
                <HelpCircle className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Help Center</h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Find answers to common questions about GreenGrid's renewable energy marketplace
              </p>
              
              {/* Search */}
              <div className="max-w-xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-card/80 border-border"
                />
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="p-4 rounded-xl bg-card/80 border border-border hover:border-primary/50 transition-colors text-center group"
                >
                  <cat.icon className={`w-6 h-6 mx-auto mb-2 ${cat.color} group-hover:scale-110 transition-transform`} />
                  <p className="text-sm font-medium">{cat.name}</p>
                </a>
              ))}
            </div>

            {/* FAQs */}
            <div className="space-y-6">
              {filteredFaqs.map((category) => {
                const CategoryIcon = categories.find(c => c.id === category.category)?.icon || HelpCircle;
                const categoryColor = categories.find(c => c.id === category.category)?.color || "text-primary";
                const categoryName = categories.find(c => c.id === category.category)?.name || category.category;

                return (
                  <Card key={category.category} id={category.category} className="bg-card/80 backdrop-blur-sm border-border scroll-mt-24">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
                        {categoryName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, index) => (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left hover:text-primary">
                              {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                              {faq.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Still Need Help? */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">Chat with our support team</p>
                  <Badge variant="outline" className="bg-primary/5 text-primary">Available 24/7</Badge>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">support@greengrid.in</p>
                  <Badge variant="outline">Response in 24h</Badge>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-saffron" />
                  </div>
                  <h3 className="font-semibold mb-1">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">1800-GREEN-GRID</p>
                  <Badge variant="outline">Mon-Fri 9AM-6PM</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-lg">Contact Us</CardTitle>
                <CardDescription>Can't find what you're looking for? Send us a message.</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-4">We'll get back to you within 24 hours.</p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          placeholder="Your name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          required
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          required
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        placeholder="How can we help?"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        placeholder="Describe your question or issue..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        required
                        rows={4}
                        className="bg-background/50"
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>
                          Send Message
                          <Send className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-lg">Additional Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { name: "User Guide", desc: "Complete guide to using GreenGrid", icon: Book },
                    { name: "API Documentation", desc: "For developers and integrations", icon: FileText },
                    { name: "Community Forum", desc: "Connect with other users", icon: Users },
                    { name: "Video Tutorials", desc: "Step-by-step walkthroughs", icon: ExternalLink },
                  ].map((resource) => (
                    <a
                      key={resource.name}
                      href="#"
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <resource.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium group-hover:text-primary transition-colors">{resource.name}</p>
                        <p className="text-sm text-muted-foreground">{resource.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Help;

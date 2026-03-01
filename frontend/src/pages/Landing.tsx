import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Zap,
  ArrowRight,
  ShoppingCart,
  BarChart3,
  Leaf,
  Globe,
  Brain,
  Building2,
  Sun,
  Wind,
  Battery,
  Menu,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import AuthHeader from "@/components/AuthHeader";
import { useReducedMotion } from "framer-motion";

const navItems = [
  { href: "#how", label: "How it Works" },
  { href: "#stats", label: "Stats" },
  { href: "#why", label: "Why GreenGrid" },
];

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    document.title = "GreenGrid — The Internet of Clean Energy";
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        "content",
        "AI-driven decentralized renewable marketplace for future cities. Buy, sell, and track clean energy with real-time carbon intelligence."
      );
    }
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:border focus:border-border"
      >
        Skip to content
      </a>

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/85 backdrop-blur-lg border-b border-border">
        <div className="h-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="GreenGrid home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glossy">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">GreenGrid</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground" role="navigation" aria-label="Primary">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">Launch App</Button>
            </Link>
            <AuthHeader />
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-card text-foreground"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <div
          className={`md:hidden border-t border-border bg-background/95 backdrop-blur-lg ${mobileMenuOpen ? "block" : "hidden"}`}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-card"
                onClick={closeMobileMenu}
              >
                {item.label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/dashboard" onClick={closeMobileMenu}>
                <Button variant="outline" size="sm" className="w-full">Launch App</Button>
              </Link>
              <Link to="/login" onClick={closeMobileMenu}>
                <Button variant="default" size="sm" className="w-full">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content">
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-12 min-h-[90vh] flex items-center" aria-labelledby="hero-heading">
        {/* Gradient orbs */}
        <motion.div
          animate={shouldReduceMotion ? {} : { x: [0, 20, 0], y: [0, -15, 0] }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.08] blur-[120px]"
          style={{ background: "hsl(142 72% 40%)" }}
          aria-hidden="true"
        />
        <motion.div
          animate={shouldReduceMotion ? {} : { x: [0, -20, 0], y: [0, 20, 0] }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[120px]"
          style={{ background: "hsl(217 91% 60%)" }}
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground text-xs">Live on 12 cities</span>
            </div>
            <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-[1.08] mb-6 text-foreground">
              Powering the{" "}
              <span className="text-gradient-tri">Internet</span> of Clean Energy
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mb-8 leading-relaxed">
              AI-driven decentralized renewable marketplace for future cities. Buy, sell, and
              track clean energy with real-time carbon intelligence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/marketplace">
                <Button variant="default" size="lg" aria-label="Explore clean energy marketplace">
                  Explore Marketplace
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" aria-label="View live energy flow dashboard">
                  View Live Energy Flow
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Secure authentication</span>
              <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
              <span>Real-time grid telemetry</span>
              <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
              <span>City-scale deployment ready</span>
            </div>
          </motion.div>

          {/* Energy Globe Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative hidden lg:flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-[400px] h-[400px] rounded-full border border-border bg-card/50 relative flex items-center justify-center">
              <div className="absolute inset-4 rounded-full border border-primary/15 animate-[spin_20s_linear_infinite]">
                <div className="absolute -top-2 left-1/2 w-4 h-4 rounded-full bg-primary glow-green" />
              </div>
              <div className="absolute inset-12 rounded-full border border-accent/15 animate-[spin_15s_linear_infinite_reverse]">
                <div className="absolute -bottom-2 right-1/4 w-3 h-3 rounded-full bg-accent glow-accent" />
              </div>
              <div className="absolute inset-20 rounded-full border border-saffron/15 animate-[spin_25s_linear_infinite]">
                <div className="absolute top-1/4 -right-1.5 w-3 h-3 rounded-full bg-saffron glow-saffron" />
              </div>

              <div className="text-center z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center glossy">
                  <Globe className="w-7 h-7 text-primary-foreground" />
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  <AnimatedCounter end={12430} suffix=" kWh" />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Clean energy flowing now</p>
              </div>

              <motion.div
                animate={shouldReduceMotion ? {} : { y: [-5, 5, -5] }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 4, repeat: Infinity }}
                className="absolute -top-4 right-8 px-3 py-1.5 rounded-full bg-card border border-border text-xs flex items-center gap-2 shadow-sm"
              >
                <Sun className="w-3 h-3 text-saffron" />
                <span className="text-foreground">Solar +24%</span>
              </motion.div>
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [5, -5, 5] }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 5, repeat: Infinity }}
                className="absolute -bottom-4 left-8 px-3 py-1.5 rounded-full bg-card border border-border text-xs flex items-center gap-2 shadow-sm"
              >
                <Wind className="w-3 h-3 text-accent" />
                <span className="text-foreground">Wind Active</span>
              </motion.div>
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [-3, 7, -3] }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 6, repeat: Infinity }}
                className="absolute top-1/2 -left-6 px-3 py-1.5 rounded-full bg-card border border-border text-xs flex items-center gap-2 shadow-sm"
              >
                <Battery className="w-3 h-3 text-primary" />
                <span className="text-foreground">94% Grid</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-12" aria-labelledby="how-heading">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 id="how-heading" className="text-3xl font-heading font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Three simple steps to join the clean energy revolution</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Sun, title: "Sell Energy", desc: "List your renewable energy on the marketplace and earn from your clean power generation." },
              { icon: ShoppingCart, title: "Buy Clean Energy", desc: "Browse and purchase verified clean energy from producers near you at competitive prices." },
              { icon: Leaf, title: "Track Carbon Impact", desc: "Monitor your carbon savings in real-time with AI-powered sustainability analytics." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card rounded-xl p-8 border border-border group transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-6 group-hover:from-primary/25 group-hover:to-primary/10 transition-all">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="stats" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-12 relative" aria-labelledby="stats-heading">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 id="stats-heading" className="text-3xl font-heading font-bold text-foreground mb-4">Live Platform Stats</h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Energy Traded Today", value: 8420, suffix: " kWh", color: "text-primary" },
              { label: "CO₂ Saved", value: 3200, suffix: " kg", color: "text-primary" },
              { label: "Active Producers", value: 847, suffix: "+", color: "text-accent" },
              { label: "Cities Connected", value: 12, suffix: "", color: "text-saffron" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card rounded-xl p-6 text-center border border-border transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <p className={`text-4xl font-heading font-bold mb-2 ${stat.color}`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-12" aria-labelledby="why-heading">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 id="why-heading" className="text-3xl font-heading font-bold text-foreground mb-4">Why GreenGrid Wins</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: "AI Energy Optimization", desc: "Machine learning models predict demand and optimize pricing in real-time." },
              { icon: BarChart3, title: "Decentralized Trading", desc: "Peer-to-peer energy exchange without intermediaries. Direct and transparent." },
              { icon: Building2, title: "Smart City Ready", desc: "Integrated with urban infrastructure for seamless city-wide energy management." },
              { icon: Leaf, title: "Carbon Intelligence", desc: "Real-time carbon tracking with actionable insights for maximum impact." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card rounded-xl p-6 border border-border group transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-primary/10 transition-all">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 px-4 sm:px-6 lg:px-12" aria-labelledby="final-cta-heading">
        <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-card p-8 sm:p-10 text-center">
          <h2 id="final-cta-heading" className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
            Build a cleaner grid with data-backed decisions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Join producers, buyers, and smart-city operators on one AI-powered marketplace for renewable energy.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg">Create Free Account</Button>
            </Link>
            <Link to="/help">
              <Button variant="outline" size="lg">Talk to Support</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 lg:px-12 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2" aria-label="GreenGrid home">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center glossy">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-sm text-foreground">GreenGrid</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/help" className="hover:text-foreground transition-colors">Help</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 GreenGrid. Powering clean energy futures.</p>
        </div>
      </footer>
      </main>
    </div>
  );
};

export default Landing;

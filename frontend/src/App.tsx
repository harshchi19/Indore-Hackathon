import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import ProducerDashboard from "./pages/ProducerDashboard";
import AIBrain from "./pages/AIBrain";
import SmartCity from "./pages/SmartCity";
import FutureSimulator from "./pages/FutureSimulator";
import InvestorZone from "./pages/InvestorZone";
import CarbonCredit from "./pages/CarbonCredit";
import EIPSimulator from "./pages/EIPSimulator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/producer" element={<ProducerDashboard />} />
          <Route path="/ai-brain" element={<AIBrain />} />
          <Route path="/smart-city" element={<SmartCity />} />
          <Route path="/future" element={<FutureSimulator />} />
          <Route path="/investor" element={<InvestorZone />} />
          <Route path="/carbon" element={<CarbonCredit />} />
          <Route path="/eip" element={<EIPSimulator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

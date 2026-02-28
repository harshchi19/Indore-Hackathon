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
import Producers from "./pages/Producers";
import BuyEnergy from "./pages/BuyEnergy";
import SmartMeter from "./pages/SmartMeter";
import Certificates from "./pages/Certificates";
import PricingAuctions from "./pages/PricingAuctions";
import Payments from "./pages/Payments";
import KYC from "./pages/KYC";
import Disputes from "./pages/Disputes";
import AdminConsole from "./pages/AdminConsole";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Contracts from "./pages/Contracts";
import TradingHistory from "./pages/TradingHistory";
import WalletPage from "./pages/Wallet";
import Community from "./pages/Community";
import CreateListing from "./pages/CreateListing";
import OrderDetails from "./pages/OrderDetails";
import ProducerDetail from "./pages/ProducerDetail";
import Help from "./pages/Help";
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/producers" element={<Producers />} />
          <Route path="/buy-energy" element={<BuyEnergy />} />
          <Route path="/producer" element={<ProducerDashboard />} />
          <Route path="/smart-meter" element={<SmartMeter />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/carbon" element={<CarbonCredit />} />
          <Route path="/pricing" element={<PricingAuctions />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/disputes" element={<Disputes />} />
          <Route path="/admin" element={<AdminConsole />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/history" element={<TradingHistory />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/community" element={<Community />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
          <Route path="/producer/:producerId" element={<ProducerDetail />} />
          <Route path="/help" element={<Help />} />
          <Route path="/ai-brain" element={<AIBrain />} />
          <Route path="/smart-city" element={<SmartCity />} />
          <Route path="/future" element={<FutureSimulator />} />
          <Route path="/investor" element={<InvestorZone />} />
          <Route path="/eip" element={<EIPSimulator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { VoiceProvider } from "@/context/VoiceContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createQueryClientConfig } from "@/utils/apiErrorHandler";
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
import AIAssistant from "./pages/AIAssistant";
import AIAnalytics from "./pages/AIAnalytics";
import AIVoice from "./pages/AIVoice";
import NetworkInsights from "./pages/NetworkInsights";
import SsoCallback from "./pages/SsoCallback";

const queryClient = createQueryClientConfig();

/* ── Helper to wrap pages in auth guard ──────────────── */
const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <VoiceProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sso-callback" element={<SsoCallback />} />
          <Route path="/help" element={<Help />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<P><Dashboard /></P>} />
          <Route path="/marketplace" element={<P><Marketplace /></P>} />
          <Route path="/producers" element={<P><Producers /></P>} />
          <Route path="/buy-energy" element={<P><BuyEnergy /></P>} />
          <Route path="/producer" element={<P><ProducerDashboard /></P>} />
          <Route path="/smart-meter" element={<P><SmartMeter /></P>} />
          <Route path="/certificates" element={<P><Certificates /></P>} />
          <Route path="/carbon" element={<P><CarbonCredit /></P>} />
          <Route path="/pricing" element={<P><PricingAuctions /></P>} />
          <Route path="/network-insights" element={<P><NetworkInsights /></P>} />
          <Route path="/payments" element={<P><Payments /></P>} />
          <Route path="/kyc" element={<P><KYC /></P>} />
          <Route path="/disputes" element={<P><Disputes /></P>} />
          <Route path="/notifications" element={<P><Notifications /></P>} />
          <Route path="/profile" element={<P><Profile /></P>} />
          <Route path="/contracts" element={<P><Contracts /></P>} />
          <Route path="/history" element={<P><TradingHistory /></P>} />
          <Route path="/wallet" element={<P><WalletPage /></P>} />
          <Route path="/community" element={<P><Community /></P>} />
          <Route path="/create-listing" element={<P><CreateListing /></P>} />
          <Route path="/order/:orderId" element={<P><OrderDetails /></P>} />
          <Route path="/producer/:producerId" element={<P><ProducerDetail /></P>} />
          <Route path="/ai-brain" element={<P><AIBrain /></P>} />
          <Route path="/ai-assistant" element={<P><AIAssistant /></P>} />
          <Route path="/ai-analytics" element={<P><AIAnalytics /></P>} />
          <Route path="/ai-voice" element={<P><AIVoice /></P>} />
          <Route path="/smart-city" element={<P><SmartCity /></P>} />
          <Route path="/future" element={<P><FutureSimulator /></P>} />
          <Route path="/investor" element={<P><InvestorZone /></P>} />
          <Route path="/eip" element={<P><EIPSimulator /></P>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminConsole /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </VoiceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

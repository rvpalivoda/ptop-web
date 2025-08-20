
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Recover from "./pages/Recover";
import NotFound from "./pages/NotFound";
import Balance from "./pages/Balance";
import Adverts from "./pages/Adverts";
import AdDeals from "./pages/AdDeals";
import MyDeals from "./pages/MyDeals";
import Transactions from "./pages/Transactions";
import Escrow from "./pages/Escrow";
import { ScrollToTopButton } from "./components/ScrollToTopButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recover" element={<Recover />} />
            <Route path="/balance" element={<Balance />} />
            <Route path="/adverts" element={<Adverts />} />
            <Route path="/my-deals" element={<MyDeals />} />
            <Route path="/ad-deals" element={<AdDeals />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/escrow" element={<Escrow />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ScrollToTopButton />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

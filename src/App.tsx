
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
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
import OrderItem from '@/pages/OrderItem';
import MainLayout from "./components/MainLayout";

const queryClient = new QueryClient();

const OrderItemRoute = () => {
  const { tokens, userInfo } = useAuth();
  return <OrderItem token={tokens?.access} currentUserName={userInfo?.username ?? ''} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/balance" element={<Balance />} />
              <Route path="/adverts" element={<Adverts />} />
              <Route path="/my-deals" element={<MyDeals />} />
              <Route path="/ad-deals" element={<AdDeals />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/escrow" element={<Escrow />} />
              <Route path="/orders/:id" element={<OrderItemRoute />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recover" element={<Recover />} />
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

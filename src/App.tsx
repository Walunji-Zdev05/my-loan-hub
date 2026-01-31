import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin pages
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientsList from "./pages/admin/ClientsList";
import CreateClient from "./pages/admin/CreateClient";
import ClientApproval from "./pages/admin/ClientApproval";
import ClientDisbursement from "./pages/admin/ClientDisbursement";
import ClientProfile from "./pages/admin/ClientProfile";
import LoanApplications from "./pages/admin/LoanApplications";
import RecordPayment from "./pages/admin/RecordPayment";
import LoanProducts from "./pages/admin/LoanProducts";
import Ledger from "./pages/admin/Ledger";
import LoanBook from "./pages/admin/LoanBook";
import PortfolioAtRisk from "./pages/admin/PortfolioAtRisk";
import ExpectedLoans from "./pages/admin/ExpectedLoans";
import NewLoanApplication from "./pages/admin/NewLoanApplication";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes - Nested under AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="clients" element={<ClientsList />} />
              <Route path="clients/new" element={<CreateClient />} />
              <Route path="clients/:clientId" element={<ClientProfile />} />
              <Route path="approval" element={<ClientApproval />} />
              <Route path="disbursement" element={<ClientDisbursement />} />
              <Route path="applications" element={<LoanApplications />} />
              <Route path="payments" element={<RecordPayment />} />
              <Route path="products" element={<LoanProducts />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="loan-book" element={<LoanBook />} />
              <Route path="par" element={<PortfolioAtRisk />} />
              <Route path="expected" element={<ExpectedLoans />} />
              <Route path="applications/new" element={<NewLoanApplication />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

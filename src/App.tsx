import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Borrower pages
import BorrowerDashboard from "./pages/borrower/BorrowerDashboard";
import BorrowerLoans from "./pages/borrower/BorrowerLoans";
import RepaymentSchedule from "./pages/borrower/RepaymentSchedule";
import ApplyLoan from "./pages/borrower/ApplyLoan";
import RepaymentCalculator from "./pages/borrower/RepaymentCalculator";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientsList from "./pages/admin/ClientsList";
import LoanApplications from "./pages/admin/LoanApplications";
import RecordPayment from "./pages/admin/RecordPayment";
import LoanProducts from "./pages/admin/LoanProducts";

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
            
            {/* Borrower Routes */}
            <Route path="/borrower" element={<BorrowerDashboard />} />
            <Route path="/borrower/loans" element={<BorrowerLoans />} />
            <Route path="/borrower/schedule" element={<RepaymentSchedule />} />
            <Route path="/borrower/apply" element={<ApplyLoan />} />
            <Route path="/borrower/calculator" element={<RepaymentCalculator />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<ClientsList />} />
            <Route path="/admin/applications" element={<LoanApplications />} />
            <Route path="/admin/payments" element={<RecordPayment />} />
            <Route path="/admin/products" element={<LoanProducts />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

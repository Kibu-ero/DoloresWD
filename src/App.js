import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserDashboard from "./pages/UserDashboard"; 
import AdminDashboard from "./pages/AdminDashboard";
import Customers from "./pages/Customers";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import CashierDashboard from "./pages/CashierDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import ManageEmployees from "./pages/ManageEmployees";
import SystemSettings from "./pages/SystemSettings";
import ErrorBoundary from "./components/common/ErrorBoundary";
import AdminFileReview from "./pages/AdminFileReview";
import EncoderDashboard from "./pages/EncoderDashboard";
import FinanceManagerDashboard from "./pages/FinanceManagerDashboard";
import BillingSheetDemo from "./pages/BillingSheetDemo";
import IdleTimeoutProvider from "./components/common/IdleTimeoutProvider";
import PublicRoute from "./components/PublicRoute";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <IdleTimeoutProvider>
          <Routes>
          <Route path="/" element={<PublicRoute><UserDashboard /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/manage-employees" element={<ManageEmployees />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/review-files" element={<AdminFileReview />} />
            <Route path="/billing-sheet-demo" element={<BillingSheetDemo />} />
          </Route>

          {/* Cashier Routes */}
          <Route element={<ProtectedRoute allowedRoles={["cashier"]} />}>
            <Route path="/cashier-dashboard" element={<CashierDashboard />} />
            <Route path="/billing" element={<Billing />} />
          </Route>

          {/* Customer Routes */}
          <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          </Route>

          {/* Encoder Routes */}
          <Route element={<ProtectedRoute allowedRoles={["encoder"]} />}>
            <Route path="/encoder-dashboard" element={<EncoderDashboard />} />
          </Route>

          {/* Finance Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={["finance_officer"]} />}>
            <Route path="/finance-dashboard" element={<FinanceManagerDashboard />} />
          </Route>

          {/* Reports - shared access for Admin, Cashier, Finance Officer */}
          <Route element={<ProtectedRoute allowedRoles={["admin", "cashier", "finance_officer"]} />}>
            <Route path="/reports" element={<Reports />} />
          </Route>
          </Routes>
        </IdleTimeoutProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

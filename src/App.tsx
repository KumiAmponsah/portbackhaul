import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AccessGuard } from "@/components/AccessGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminPayments from "./pages/admin/AdminPayments";
import {
  AdminCargo,
  AdminClearingAgents,
  AdminDrivers,
  AdminTrips,
  AdminTrucks,
} from "./pages/admin/AdminRecords";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import AccountStatusPage from "./pages/app/AccountStatus";
import AgentTrips from "./pages/app/agent/AgentTrips";
import AvailableTrucks from "./pages/app/agent/AvailableTrucks";
import CompletedTrips from "./pages/app/agent/CompletedTrips";
import MyTruckRequests from "./pages/app/agent/MyTruckRequests";
import NewCargo from "./pages/app/agent/NewCargo";
import RequestTruck from "./pages/app/agent/RequestTruck";
import { AppIndexRedirect, AppLayout } from "./pages/app/AppRouter";
import DriverEarnings from "./pages/app/driver/DriverEarnings";
import DriverHome from "./pages/app/driver/DriverHome";
import DriverTrip from "./pages/app/driver/DriverTrip";
import DriverTrips from "./pages/app/driver/DriverTrips";
import NotificationsPage from "./pages/app/Notifications";
import ProfilePage from "./pages/app/Profile";
import ShipmentDetail from "./pages/app/ShipmentDetail";
import TripDetail from "./pages/app/TripDetail";
import AuthCallback from "./pages/auth/AuthCallback";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import NotFound from "./pages/NotFound";
import ClearingAgents from "./pages/public/ClearingAgents";
import Contact from "./pages/public/Contact";
import GhanaBurkinaFaso from "./pages/public/GhanaBurkinaFaso";
import Home from "./pages/public/Home";
import HowItWorks from "./pages/public/HowItWorks";
import { Privacy, Terms } from "./pages/public/Legal";
import TemaPort from "./pages/public/TemaPort";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* ---------- public, indexable marketing site ---------- */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/clearing-agents" element={<ClearingAgents />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/tema-port" element={<TemaPort />} />
                <Route path="/ghana-to-burkina-faso" element={<GhanaBurkinaFaso />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Legacy marketing routes — kept as redirects so inbound links
                    and bookmarks don't 404 after the role consolidation. */}
                <Route
                  path="/cargo-owners"
                  element={<Navigate to="/clearing-agents" replace />}
                />
                <Route
                  path="/truck-drivers"
                  element={<Navigate to="/clearing-agents" replace />}
                />
              </Route>

              {/* ---------- authentication ---------- */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* ---------- account status (authenticated, not yet approved) ---------- */}
              <Route
                path="/app/account-status"
                element={
                  <AccessGuard>
                    <AccountStatusPage />
                  </AccessGuard>
                }
              />

              {/* ---------- authenticated application ---------- */}
              <Route
                path="/app"
                element={
                  <AccessGuard>
                    <AppLayout />
                  </AccessGuard>
                }
              >
                <Route index element={<AppIndexRedirect />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="notifications" element={<NotificationsPage />} />

                {/* shared */}
                <Route
                  path="shipments/:id"
                  element={
                    <AccessGuard requireApproved>
                      <ShipmentDetail />
                    </AccessGuard>
                  }
                />
                <Route
                  path="trips/:id"
                  element={
                    <AccessGuard requireApproved>
                      <TripDetail />
                    </AccessGuard>
                  }
                />

                {/* clearing agent */}
                <Route
                  path="agent/new-cargo"
                  element={
                    <AccessGuard roles={["CLEARING_AGENT"]} requireApproved>
                      <NewCargo />
                    </AccessGuard>
                  }
                />
                <Route
                  path="agent/request-truck"
                  element={
                    <AccessGuard roles={["CLEARING_AGENT"]} requireApproved>
                      <RequestTruck />
                    </AccessGuard>
                  }
                />
                <Route
                  path="agent/available-trucks"
                  element={
                    <AccessGuard roles={["CLEARING_AGENT"]} requireApproved>
                      <AvailableTrucks />
                    </AccessGuard>
                  }
                />
                <Route
                  path="agent/trips"
                  element={
                    <AccessGuard roles={["CLEARING_AGENT"]} requireApproved>
                      <AgentTrips />
                    </AccessGuard>
                  }
                />
                <Route
                  path="agent/my-truck-requests"
                  element={
                    <AccessGuard roles={["CLEARING_AGENT"]} requireApproved>
                      <MyTruckRequests />
                    </AccessGuard>
                  }
                />
                <Route
                  path="agent/completed"
                  element={
                    <AccessGuard roles={["CLEARING_AGENT"]} requireApproved>
                      <CompletedTrips />
                    </AccessGuard>
                  }
                />

                {/* driver */}
                <Route
                  path="driver"
                  element={
                    <AccessGuard roles={["DRIVER"]} requireApproved>
                      <DriverHome />
                    </AccessGuard>
                  }
                />
                <Route
                  path="driver/trips"
                  element={
                    <AccessGuard roles={["DRIVER"]} requireApproved>
                      <DriverTrips />
                    </AccessGuard>
                  }
                />
                <Route
                  path="driver/trip/:id"
                  element={
                    <AccessGuard roles={["DRIVER"]} requireApproved>
                      <DriverTrip />
                    </AccessGuard>
                  }
                />
                <Route
                  path="driver/earnings"
                  element={
                    <AccessGuard roles={["DRIVER"]} requireApproved>
                      <DriverEarnings />
                    </AccessGuard>
                  }
                />
              </Route>

              {/* ---------- admin ---------- */}
              <Route
                path="/admin"
                element={
                  <AccessGuard roles={["ADMIN"]} requireApproved permission="ADMIN_VIEW">
                    <AdminLayout>
                      <Outlet />
                    </AdminLayout>
                  </AccessGuard>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="cargo" element={<AdminCargo />} />
                <Route path="trucks" element={<AdminTrucks />} />
                <Route path="drivers" element={<AdminDrivers />} />
                <Route path="clearing-agents" element={<AdminClearingAgents />} />
                <Route path="trips" element={<AdminTrips />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="disputes" element={<AdminDisputes />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="integrations" element={<AdminIntegrations />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import CallRecordsPage from "./components/CallRecordsPage";
import CallRecordPrintPage from "./components/CallRecordPrintPage";
import UploadPage from "./components/UploadPage";
import ExportPage from "./components/ExportPage";
import FleetStatisticsPage from "./components/FleetStatisticsPage";
import DocsPage from "./components/DocsPage";
import ProfilePage from "./components/ProfilePage";
import SettingsPage from "./components/SettingsPage";
import InspeksiKPCPage from "./components/InspeksiKPCPage";
import NecHistoryPage from "./components/NEC/NecHistoryPage";
import LinkInternalPage from "./components/InternalLink/LinkInternalPage";
import NecTowerLinkManagement from "./components/NEC/NecTowerLinkManagement";
import SwrSignalPage from "./components/Swr/SwrSignalPage";
import LetterNumberPage from "./components/LetterNumberPage";
import CompanyPage from "./components/CompanyPage";
import DocumentTypePage from "./components/DocumentTypePage";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/toaster";
import RadioInternalPage from "./components/Radio/RadioInternalPage";
import RadioContractorPage from "./components/Radio/RadioContractorPage";
import RadioUnitPage from "./components/Radio/RadioUnitPage";
import RadioScrapPage from "./components/Radio/RadioScrapPage";
import RadioHubPage from "./components/Radio/RadioHubPage";
import CctvKpcPage from "./components/CctvKpc/CctvKpcPage";
import VerifyPage from "./components/VerifyPage";
import KpiMonitoringPage from "./components/Kpi/KpiMonitoringPage";
import PmSchedulePage from "./components/PmSchedule/PmSchedulePage";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import RadioRepairDashboardPage from "./components/RadioRepair/RadioRepairDashboardPage";
import RadioHandoverPage from "./components/RadioHandover/RadioHandoverPage";
import RadioHandoverWarehousePage from "./components/RadioHandover/RadioHandoverWarehousePage";
import WarehouseBorrowHistoryPage from "./components/WarehouseBorrow/WarehouseBorrowHistoryPage";
import WarehouseBorrowRequestPage from "./components/WarehouseBorrow/WarehouseBorrowRequestPage";
import WarehouseSupervisionPage from "./components/WarehouseBorrow/WarehouseSupervisionPage";
import WarehouseCatalogPage from "./components/WarehouseBorrow/WarehouseCatalogPage";

// ✅ HELPER: CEK PERMISSION DARI LOCALSTORAGE
function hasPermission(permission: string): boolean {
  const permissionsStr = localStorage.getItem("permissions");
  if (!permissionsStr) return false;

  try {
    const permissions: string[] = JSON.parse(permissionsStr);
    return permissions.includes(permission);
  } catch {
    return false;
  }
}

// ✅ FIXED: PRIORITY ROUTE BERDASARKAN PERMISSION YANG ADA
function getDefaultRoute(): string {
  // Priority order based on permission availability
  if (hasPermission("dashboard.view")) return "/dashboard";
  if (hasPermission("letter.menu")) return "/letter-numbers";
  if (hasPermission("inspeksi.menu")) return "/inspeksi-kpc";
  if (hasPermission("docs.view")) return "/docs";
  if (hasPermission("call.record.menu")) return "/callrecords";
  if (hasPermission("warehouse.borrow.supervise")) return "/warehouse/supervision";
  if (hasPermission("warehouse.borrow.menu") || hasPermission("warehouse.borrow.view")) return "/warehouse/borrow-history";
  if (hasPermission("radio.repair.menu") || hasPermission("radio.repair.view"))
    return "/radio-repair-dashboard";

  // Fallback: kalau tidak ada permission apapun, ke profile
  return "/profile";
}

function DefaultRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const route = getDefaultRoute();
    console.log("🔀 Redirecting to default route:", route);
    navigate(route, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ✅ NEW: Save location to allow redirecting back after login
  return user ? children : <Navigate to="/" state={{ from: location }} replace />;
}

// ✅ ROUTE GUARD: CEK PERMISSION SEBELUM RENDER PAGE
function PermissionGuard({
  permission,
  anyOf,
  children,
}: {
  permission?: string;
  anyOf?: string[];
  children: JSX.Element;
}) {
  const hasAccess = anyOf?.length
    ? anyOf.some((p) => hasPermission(p))
    : permission
      ? hasPermission(permission)
      : false;

  if (!hasAccess) {
    console.warn(
      `⚠️ Access denied — required: ${anyOf?.join(" | ") ?? permission}`
    );
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return children;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <Routes>
          <Route path="/" element={<DefaultRoute />} />

          {/* ✅ PROTECTED ROUTES WITH PERMISSION CHECK */}
          <Route
            path="/dashboard"
            element={
              <PermissionGuard permission="dashboard.view">
                <Dashboard setActiveTab={setActiveTab} />
              </PermissionGuard>
            }
          />

          <Route
            path="/inspeksi-kpc"
            element={
              <PermissionGuard permission="inspeksi.menu">
                <InspeksiKPCPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/docs"
            element={
              <PermissionGuard permission="docs.view">
                <DocsPage setActiveTab={setActiveTab} />
              </PermissionGuard>
            }
          />

          <Route
            path="/callrecords"
            element={
              <PermissionGuard permission="call.record.menu">
                <CallRecordsPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/callrecord-print"
            element={
              <PermissionGuard permission="call.record.menu">
                <CallRecordPrintPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/upload"
            element={
              <PermissionGuard permission="callrecord.import">
                <UploadPage
                  setActiveTab={setActiveTab}
                  onBack={() => setActiveTab("dashboard")}
                />
              </PermissionGuard>
            }
          />

          <Route
            path="/export"
            element={
              <PermissionGuard permission="callrecord.view-any">
                <ExportPage
                  setActiveTab={setActiveTab}
                  onBack={() => setActiveTab("dashboard")}
                />
              </PermissionGuard>
            }
          />

          <Route
            path="/fleet-statistics"
            element={
              <PermissionGuard permission="fleet.menu">
                <FleetStatisticsPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/nec-history"
            element={
              <PermissionGuard permission="nec.histori.menu">
                <NecHistoryPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/link-internal"
            element={
              <PermissionGuard permission="internal.link.menu">
                <LinkInternalPage />
              </PermissionGuard>
            }
          />

          <Route path="/nec-management" element={<NecTowerLinkManagement />} />

          <Route path="/swr-signal" element={<SwrSignalPage />} />

          {/* ✅ RADIO HUB (Mobile menu) */}
          <Route path="/radio" element={
            <PermissionGuard anyOf={["radio.view", "radio.kpc.menu", "radio.scrap.view", "radio.repair.menu", "radio.handover.menu", "fleet.menu"]}>
              <RadioHubPage />
            </PermissionGuard>
          } />

          {/* ✅ RADIO MANAGEMENT ROUTES */}
          <Route path="/radio-internal" element={
            <PermissionGuard permission="radio.view" >
              <RadioInternalPage />
            </PermissionGuard>
          } />
          <Route path="/radio-contractor" element={
            <PermissionGuard permission="radio.view" >
              <RadioContractorPage />
            </PermissionGuard>
          } />
          <Route path="/radio-unit" element={
            <PermissionGuard permission="radio.view" >
              <RadioUnitPage />
            </PermissionGuard>
          } />
          <Route path="/radio-scrap" element={
            <PermissionGuard permission="radio.scrap.view" >
              <RadioScrapPage />
            </PermissionGuard>
          } />
          <Route path="/radio-repair-dashboard" element={
            <PermissionGuard anyOf={["radio.repair.menu", "radio.repair.view"]}>
              <RadioRepairDashboardPage />
            </PermissionGuard>
          } />
          <Route path="/radio-handover" element={
            <PermissionGuard anyOf={["radio.handover.menu", "radio.handover.view"]}>
              <RadioHandoverPage />
            </PermissionGuard>
          } />
          <Route path="/radio-handover/warehouse" element={
            <PermissionGuard anyOf={["radio.handover.menu", "radio.handover.view"]}>
              <RadioHandoverWarehousePage />
            </PermissionGuard>
          } />
          {/* ✅ WAREHOUSE HUB (Mobile menu) */}
          <Route path="/warehouse" element={
            <PermissionGuard anyOf={["warehouse.borrow.menu", "warehouse.borrow.view", "warehouse.borrow.create", "warehouse.borrow.supervise"]}>
              <WarehouseHubPage />
            </PermissionGuard>
          } />

          <Route path="/warehouse/borrow-history" element={
            <PermissionGuard anyOf={["warehouse.borrow.menu", "warehouse.borrow.view"]}>
              <WarehouseBorrowHistoryPage />
            </PermissionGuard>
          } />
          <Route path="/warehouse/borrow-request" element={
            <PermissionGuard anyOf={["warehouse.borrow.menu", "warehouse.borrow.create"]}>
              <WarehouseBorrowRequestPage />
            </PermissionGuard>
          } />
          <Route path="/warehouse/supervision" element={
            <PermissionGuard permission="warehouse.borrow.supervise">
              <WarehouseSupervisionPage />
            </PermissionGuard>
          } />
          <Route path="/warehouse/catalog" element={
            <PermissionGuard anyOf={["warehouse.borrow.menu", "warehouse.borrow.supervise"]}>
              <WarehouseCatalogPage />
            </PermissionGuard>
          } />

          {/* ✅ CCTV KPC ROUTE */}
          <Route path="/cctv-kpc" element={
            <PermissionGuard permission="cctv.kpc.view">
              <CctvKpcPage />
            </PermissionGuard>
          } />

          {/* ✅ LETTER NUMBERING ROUTES */}
          <Route
            path="/letter-numbers"
            element={
              <PermissionGuard permission="letter.view">
                <LetterNumberPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/companies"
            element={
              <PermissionGuard permission="letter.view">
                <CompanyPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/document-types"
            element={
              <PermissionGuard permission="letter.view">
                <DocumentTypePage />
              </PermissionGuard>
            }
          />

          <Route
            path="/kpi-tracking"
            element={
              <PermissionGuard permission="kpi.view">
                <KpiMonitoringPage />
              </PermissionGuard>
            }
          />

          {/* ✅ PM SCHEDULE ROUTE */}
          <Route
            path="/pm-schedule"
            element={
              <PermissionGuard permission="pmschedule.view">
                <PmSchedulePage />
              </PermissionGuard>
            }
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

          {/* ✅ PROFILE SELALU ACCESSIBLE */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* ✅ CATCH-ALL: REDIRECT KE DEFAULT ROUTE JIKA TIDAK ADA YANG COCOK */}
          <Route path="*" element={<DefaultRoute />} />
        </Routes>
      </Layout>
      <Toaster />
    </ErrorBoundary>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={!user ? <Login /> : <DefaultRoute />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <DefaultRoute />}
      />
      <Route
        path="/forgot-password"
        element={!user ? <ForgotPassword /> : <DefaultRoute />}
      />
      <Route
        path="/reset-password"
        element={!user ? <ResetPassword /> : <DefaultRoute />}
      />
      <Route path="/verify/gatepass/:token" element={<VerifyPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
import { SignalRProvider } from "./contexts/SignalRContext";
import WarehouseHubPage from "./components/WarehouseBorrow/WarehouseHubPage";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SignalRProvider>
          <AppRoutes />
        </SignalRProvider>
      </AuthProvider>
    </Router>
  );
}

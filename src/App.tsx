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
import RadioTrunkingPage from "./components/Radio/RadioTrunkingPage";
import RadioConventionalPage from "./components/Radio/RadioConventionalPage";
import RadioGrafirPage from "./components/Radio/RadioGrafirPage";
import RadioScrapPage from "./components/Radio/RadioScrapPage";
import VerifyPage from "./components/VerifyPage";

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
  children,
}: {
  permission: string;
  children: JSX.Element;
}) {
  const hasAccess = hasPermission(permission);

  if (!hasAccess) {
    console.warn(`⚠️ Access denied to route requiring: ${permission}`);
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

          {/* ✅ RADIO MANAGEMENT ROUTES */}
          <Route path="/radio-trunking" element={
            <PermissionGuard permission="radio.view" >
              <RadioTrunkingPage />
            </PermissionGuard>
          } />
          <Route path="/radio-conventional" element={
            <PermissionGuard permission="radio.view" >
              <RadioConventionalPage />
            </PermissionGuard>
          } />
          <Route path="/radio-grafir" element={
            <PermissionGuard permission="radio.view" >
              <RadioGrafirPage />
            </PermissionGuard>
          } />
          <Route path="/radio-scrap" element={
            <PermissionGuard permission="radio.scrap.view" >
              <RadioScrapPage />
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
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/dashboard" replace />}
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

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
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
  if (hasPermission("letter.view")) return "/letter-numbers";
  if (hasPermission("inspeksi.temuan-kpc.view")) return "/inspeksi-kpc";
  if (hasPermission("docs.view")) return "/docs";
  if (hasPermission("callrecord.view")) return "/callrecords";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
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
              <PermissionGuard permission="inspeksi.temuan-kpc.view">
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
              <PermissionGuard permission="callrecord.view">
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
              <PermissionGuard permission="callrecord.view">
                <FleetStatisticsPage />
              </PermissionGuard>
            }
          />

          <Route
            path="/nec-history"
            element={
              <PermissionGuard permission="nec.signal.view">
                <NecHistoryPage />
              </PermissionGuard>
            }
          />

          <Route path="/nec-management" element={<NecTowerLinkManagement />} />

          <Route path="/swr-signal" element={<SwrSignalPage />} />

          {/* ✅ RADIO MANAGEMENT ROUTES */}
          <Route path="/radio-trunking" element={<RadioTrunkingPage />} />
          <Route path="/radio-conventional" element={<RadioConventionalPage />} />
          <Route path="/radio-grafir" element={<RadioGrafirPage />} />
          <Route path="/radio-scrap" element={<RadioScrapPage />} />

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
            element={
              <PermissionGuard permission="role.view">
                <SettingsPage />
              </PermissionGuard>
            }
          />

          {/* ✅ PROFILE SELALU ACCESSIBLE */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* ✅ CATCH-ALL: REDIRECT KE DEFAULT ROUTE */}
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
      <Route
        path="/*"
        element={user ? <AppContent /> : <Navigate to="/" replace />}
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

// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute, { AdminRoute, ModeratorRoute, MultiRoleRoute } from "./utils/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// ============================================
// PÁGINAS PÚBLICAS
// ============================================
import Index from "./pages/Index";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";

// ============================================
// PÁGINAS PROTEGIDAS - Dashboard
// ============================================
import Home from "./pages/Dashboard/Home";

// ============================================
// PÁGINAS PROTEGIDAS - Otros
// ============================================
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import Blank from "./pages/Blank";

// ============================================
// PÁGINAS PROTEGIDAS - Formularios
// ============================================
import FormElements from "./pages/Forms/FormElements";

// ============================================
// PÁGINAS PROTEGIDAS - Tablas
// ============================================
import BasicTables from "./pages/Tables/BasicTables";

// ============================================
// PÁGINAS PROTEGIDAS - UI Elements
// ============================================
import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";

// ============================================
// PÁGINAS PROTEGIDAS - Charts
// ============================================
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";

// ============================================
// PÁGINAS PROTEGIDAS - PDF Scanner
// ============================================
import PdfToScan from "./pages/Pdf_to_scanner";
import ScanDocWeb from "./pages/Pdf_to_scanner/ScanDocWeb";

// ============================================
// PÁGINAS PROTEGIDAS - Trabajadores
// ============================================
import Trabajador_Index from "./pages/Trabajadores/Trabajador_Index";

// ============================================
// SPINNER GLOBAL
// ============================================
const GlobalLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      <p className="text-gray-600 text-lg font-medium">Cargando aplicación...</p>
    </div>
  </div>
);

// ============================================
// PUBLIC ROUTE
// ============================================
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <GlobalLoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return children;
};

// ============================================
// APP PRINCIPAL
// ============================================
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>

          {/* ====================== */}
          {/* RUTAS PÚBLICAS        */}
          {/* ====================== */}
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

          {/* ====================== */}
          {/* RUTAS PROTEGIDAS       */}
          {/* ====================== */}
          <Route element={<ProtectedRoute fallback={<GlobalLoadingSpinner />} />}>
            <Route element={<AppLayout />}>

              {/* Dashboard */}
              <Route path="/home" element={<Home />} />

              {/* Otros */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Formularios */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Tablas */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* UI Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />

              {/* PDF Scanner */}
              <Route path="/pdf-to-scan" element={<PdfToScan />} />
              <Route path="/scan-doc" element={<ScanDocWeb />} />

              {/* Trabajadores */}
              <Route path="/trabajadores" element={<Trabajador_Index />} />

            </Route>
          </Route>

          {/* ====================== */}
          {/* ERRORES */}
          {/* ====================== */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

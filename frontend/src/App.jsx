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
import Blank from "./pages/Blank";
import PdfToScan from "./pages/Pdf_to_scanner";
import ScanDocWeb from "./pages/Pdf_to_scanner/ScanDocWeb";
import Home from "./pages/Dashboard/Home";
import Trabajador_Index from "./pages/Trabajadores/Trabajador_Index";
import Nave_Index from "./pages/Naves/index";
import UserProfiles from "./pages/UserProfiles";
import DetalleNave from "./pages/Naves/detalleNave";
import NaveLayout from "./layout/NaveLayout";
import PirotecniaIndex from "./pages/Naves/Pirotecnia/index";
import CertificadosIndex from "./pages/Naves/Certificados/index";
import EstudiosIndex from "./pages/Naves/Estudios/index";
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
              <Route path="/blank" element={<Blank />} />

              {/* PDF Scanner */}
              <Route path="/pdf-to-scan" element={<PdfToScan />} />
              <Route path="/scan-doc" element={<ScanDocWeb />} />

              {/* Trabajadores */}
              <Route path="/trabajadores" element={<Trabajador_Index />} />

              {/* Naves */}
              <Route path="/naves" element={<Nave_Index />} />
              <Route path="naves/:id/*" element={<NaveLayout />}>
                <Route index element={<DetalleNave />} />
                <Route path="pirotecnia" element={<PirotecniaIndex />} />
                <Route path="certificados" element={<CertificadosIndex />} />
                <Route path="estudios" element={<EstudiosIndex />} />
              </Route>

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

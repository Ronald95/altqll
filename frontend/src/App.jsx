import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./utils/ProtectedRoute";
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
// COMPONENTE DE LOADING GLOBAL
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
// COMPONENTE PARA RUTAS PÚBLICAS
// ============================================
// Redirige a /home si ya está autenticado
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <GlobalLoadingSpinner />;
  }

  // Si ya está autenticado, redirigir a home
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function App() {
  const { loading } = useAuth();

  // Mostrar loading global mientras se verifica la autenticación inicial
  if (loading) {
    return <GlobalLoadingSpinner />;
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ========================================= */}
        {/* RUTAS PÚBLICAS                           */}
        {/* ========================================= */}
        
        {/* Página de bienvenida */}
        <Route path="/" element={<Index />} />

        {/* Autenticación - Solo accesibles si NO está autenticado */}
        <Route 
          path="/signin" 
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          } 
        />

        {/* ========================================= */}
        {/* RUTAS PROTEGIDAS CON LAYOUT              */}
        {/* ========================================= */}
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dashboard Principal */}
            <Route path="/home" element={<Home />} />

            {/* ===== PERFIL Y CONFIGURACIÓN ===== */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* ===== FORMULARIOS ===== */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* ===== TABLAS ===== */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* ===== UI ELEMENTS ===== */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* ===== GRÁFICOS ===== */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />

            {/* ===== PDF SCANNER ===== */}
            <Route path="/pdf-to-scan" element={<PdfToScan />} />
            <Route path="/scan-doc" element={<ScanDocWeb />} />

            {/* ===== TRABAJADORES ===== */}
            <Route path="/trabajadores" element={<Trabajador_Index />} />
          </Route>
        </Route>

        {/* ========================================= */}
        {/* RUTAS DE ERROR                           */}
        {/* ========================================= */}
        
        {/* Página 404 - Not Found */}
        <Route path="/404" element={<NotFound />} />
        
        {/* Redirect de rutas no encontradas */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}
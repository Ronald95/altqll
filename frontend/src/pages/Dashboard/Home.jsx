// Home.jsx - Actualizado
import PageMeta from "../../components/common/PageMeta";
import NavesDashboard from "./NavesDashboard";

export default function Home() {
  return (
    <>
      <PageMeta 
        title="Dashboard"
        description="Dashboard del sistema AltQll"
      />
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Dashboard - Naviera Altamar
          </h1>
        </div>
        
        {/* Dashboard Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Mis Naves</h2>
            <div className="text-sm text-gray-500">
              Total: <span className="font-semibold">{/* Aquí podrías agregar un contador */}</span>
            </div>
          </div>
          <NavesDashboard />
        </div>
      </div>
    </>
  );
}
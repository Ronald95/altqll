// components/LoadingScreen.jsx
const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner de DaisyUI o CSS */}
        <span className="loading loading-spinner loading-lg text-brand-500"></span>
        <p className="text-gray-500 dark:text-gray-400 animate-pulse font-medium">
          Verificando sesión...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
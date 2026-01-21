import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { Toaster } from 'react-hot-toast';

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        // Mostrar notificación de éxito
        <Toaster 
          toast={{ 
            title: 'Inicio de sesión exitoso',
            status: 'success',
            duration: 3000,
            isClosable: true,
          }} 
        />;
        
        // Redirigir a home
        navigate('/home', { replace: true });
      }
    } catch (error) {
      // El error ya es manejado por el AuthContext
      console.error('Error de autenticación:', error);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/home"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Volver al Panel
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¡Introduce tu correo electrónico y contraseña para iniciar sesión!
          </p>
        </div>       

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label>
                Correo electrónico <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="info@gmail.com"
                name="username"
                type="text"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <Label>
                Contraseña <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Introduce tu contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={isChecked} 
                  onChange={() => setIsChecked(!isChecked)} 
                  id="remember-me"
                />
                <label 
                  htmlFor="remember-me"
                  className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400"
                >
                  Mantenerme conectado
                </label>
              </div>
              <Link
                to="/reset-password"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div>
              <Button 
                type="submit" 
                disabled={authLoading} 
                className="w-full" 
                size="sm"
                isLoading={authLoading}
              >
                {authLoading ? 'Iniciando sesión...' : 'Ingresar'}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            ¿No tienes una cuenta?{" "}
            <Link
              to="/signup"
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
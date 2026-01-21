import React from 'react';

const Index = () => {
  return (
    <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute top-0 left-0 right-0 h-20 bg-white opacity-5"></div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white opacity-5"></div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block">Bienvenido a</span>
                <span className="block text-indigo-200">Nuestra Plataforma</span>
              </h1>
              <p className="mt-3 text-base text-indigo-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Descubre todas las funcionalidades que tenemos preparadas para ti. Únete a nuestra comunidad y comienza tu experiencia hoy mismo.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <a
                    href="/signin"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out"
                  >
                    Iniciar sesión
                  </a>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a
                    href="/register"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out"
                  >
                    Registrarse
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Imagen ilustrativa (opcional) */}
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 hidden lg:block">
        <div className="h-full w-full object-cover">
          <div className="h-full bg-indigo-400 opacity-20"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
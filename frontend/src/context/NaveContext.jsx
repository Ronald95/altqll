import { createContext, useContext, useState, useEffect } from "react";

const NaveContext = createContext();

export const NaveProvider = ({ children }) => {
  const [naveSeleccionada, setNaveSeleccionada] = useState(null);

  // 🔹 Cargar nave desde sessionStorage al iniciar
  useEffect(() => {
    const storedNave = sessionStorage.getItem("naveSeleccionada");
    if (storedNave) {
      try {
        setNaveSeleccionada(JSON.parse(storedNave));
      } catch (e) {
        console.error("Error al leer nave guardada:", e);
      }
    }
  }, []);

  // 🔹 Guardar en sessionStorage cada vez que cambie
  useEffect(() => {
    if (naveSeleccionada) {
      sessionStorage.setItem("naveSeleccionada", JSON.stringify(naveSeleccionada));
    } else {
      sessionStorage.removeItem("naveSeleccionada");
    }
  }, [naveSeleccionada]);

  return (
    <NaveContext.Provider value={{ naveSeleccionada, setNaveSeleccionada }}>
      {children}
    </NaveContext.Provider>
  );
};

export const useNave = () => useContext(NaveContext);

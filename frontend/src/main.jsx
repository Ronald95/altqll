import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App";
import { AppWrapper } from "./components/common/PageMeta";
import { ThemeProvider } from "./context/ThemeContext";
import { NaveProvider } from "./context/NaveContext";
import { AuthProvider } from "./context/AuthContext";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <StrictMode>
    <ThemeProvider>
     <AppWrapper>
        <AuthProvider>
        <NaveProvider>
          <App />
        </NaveProvider>
      </AuthProvider>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>
);

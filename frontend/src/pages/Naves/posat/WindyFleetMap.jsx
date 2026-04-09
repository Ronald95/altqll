import { useEffect, useRef } from "react";

const WindyMap = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const options = {
      key: "R3BzP2G6K6nCzGOBqUaF359dlMO6wVth",
      verbose: true,
      lat: 50.4,
      lon: 14.3,
      zoom: 5,
    };

    const init = () => {
      if (!window.windyInit) return;

      window.windyInit(options, (windyAPI) => {
        const { map, store } = windyAPI;

        // 🔥 evita error gl-particles
        store.set("particlesAnim", "off");

        window.L.popup()
          .setLatLng([options.lat, options.lon])
          .setContent("Hello World")
          .openOn(map);
      });
    };

    // Espera a que cargue Windy
    if (window.windyInit) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.windyInit) {
          clearInterval(interval);
          init();
        }
      }, 300);
    }
  }, []);

  return <div id="windy" style={{ width: "100%", height: "500px" }} />;
};

export default WindyMap;
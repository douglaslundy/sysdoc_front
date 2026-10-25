import { useCallback, useState } from "react";

const ESTADO_POR_CODIGO = { 1: "negado", 2: "indisponivel", 3: "timeout" };

// estado: ocioso | capturando | ok | negado | indisponivel | timeout | inseguro
export function useGeolocalizacao() {
  const [estado, setEstado] = useState("ocioso");
  const [coords, setCoords] = useState(null);

  const capturar = useCallback(() => {
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setEstado("inseguro");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setEstado("indisponivel");
      return;
    }

    setEstado("capturando");
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: c.latitude, lng: c.longitude, precisao: c.accuracy });
        setEstado("ok");
      },
      (erro) => setEstado(ESTADO_POR_CODIGO[erro?.code] || "indisponivel"),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  return { estado, coords, capturar };
}

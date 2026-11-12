import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });

const CDN = "https://unpkg.com/leaflet@1/dist";

// shortcut: CSS e imagens do marcador vêm do CDN (unpkg), como nas visitas do ACS; sem rede o mapa perde o estilo e o ícone. Empacotar se for usado sem internet.
const garantirCss = () => {
  if (document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href = `${CDN}/leaflet.css`;
  document.head.appendChild(link);
};

// O bundler quebra o caminho padrão do ícone do marcador (aparece uma imagem quebrada): aponta para o CDN.
const configurarIcone = () =>
  import("leaflet").then((mod) => {
    const L = mod.default || mod;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: `${CDN}/images/marker-icon.png`,
      iconRetinaUrl: `${CDN}/images/marker-icon-2x.png`,
      shadowUrl: `${CDN}/images/marker-shadow.png`,
    });
  });

/** Mapa (OpenStreetMap) com um marcador no ponto. O pai define a altura. */
export default function MapaPonto({ lat, lng, zoom = 17, rotulo = "Mapa com a posição do poste" }) {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let vivo = true;
    garantirCss();
    configurarIcone().catch(() => {}).then(() => vivo && setPronto(true));
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <div role="img" aria-label={`${rotulo}: ${lat}, ${lng}`} className="size-full">
      {pronto ? (
        <MapContainer center={[lat, lng]} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lng]} />
        </MapContainer>
      ) : null}
    </div>
  );
}

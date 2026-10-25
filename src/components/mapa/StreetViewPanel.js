import { useEffect, useState } from "react";
import { CameraOff, MapPin } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { Carregando } from "../ui/carregando";

const GOOGLE_EMBED_SV = (lat, lng, key) => `https://www.google.com/maps/embed/v1/streetview?key=${key}&location=${lat},${lng}&fov=90`;
export const GOOGLE_SV_URL = (lat, lng) => `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;

// Arredonda para não vazar ruído de ponto flutuante (-47.203000000000003) na consulta.
const arred = (n) => Number(n.toFixed(6));

/**
 * Imagem de rua no ponto: 1º Mapillary (NEXT_PUBLIC_MAPILLARY_TOKEN), 2º Street View embutido do Google
 * (NEXT_PUBLIC_GOOGLE_MAPS_KEY), 3º link para o Google Maps. Mesma lógica das visitas do ACS.
 */
export default function StreetViewPanel({ lat, lng }) {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const mapillaryToken = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN;

  const [imgUrl, setImgUrl] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(mapillaryToken));
  const [semImagem, setSemImagem] = useState(!mapillaryToken);
  const [erroApi, setErroApi] = useState(false);

  useEffect(() => {
    if (!mapillaryToken) return undefined;

    let vivo = true;
    setCarregando(true);
    setImgUrl(null);
    setSemImagem(false);
    setErroApi(false);

    const d = 0.003;
    const bbox = `${arred(lng - d)},${arred(lat - d)},${arred(lng + d)},${arred(lat + d)}`;
    fetch(`https://graph.mapillary.com/images?access_token=${mapillaryToken}&fields=id,thumb_2048_url&bbox=${bbox}&limit=1`)
      .then((r) => {
        if (!r.ok) {
          if (vivo) setErroApi(true);
          return null;
        }
        return r.json();
      })
      .then((dados) => {
        if (!dados || !vivo) return;
        const img = dados?.data?.[0];
        if (img?.thumb_2048_url) setImgUrl(img.thumb_2048_url);
        else setSemImagem(true);
      })
      .catch(() => vivo && setSemImagem(true))
      .finally(() => vivo && setCarregando(false));

    return () => {
      vivo = false;
    };
  }, [lat, lng, mapillaryToken]);

  if (carregando) return <Carregando className="h-full justify-center py-0" />;

  if (imgUrl) {
    return (
      <a href={GOOGLE_SV_URL(lat, lng)} target="_blank" rel="noopener noreferrer" className="block size-full">
        <img src={imgUrl} alt="Street View" className="size-full object-cover" />
      </a>
    );
  }

  if (semImagem && googleKey) {
    return (
      <iframe
        title="Street View"
        className="block size-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={GOOGLE_EMBED_SV(lat, lng, googleKey)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <CameraOff aria-hidden className="size-6" />
      <p className="px-4 text-center text-xs">{erroApi ? "Erro ao acessar o serviço de imagens." : "Sem cobertura de imagens nesta área."}</p>
      <a href={GOOGLE_SV_URL(lat, lng)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
        <MapPin /> Ver no Google Maps
      </a>
    </div>
  );
}

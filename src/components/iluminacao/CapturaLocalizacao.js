import { useEffect } from "react";
import { MapPin } from "lucide-react";
import { useGeolocalizacao } from "../../hooks/useGeolocalizacao";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";

export const PRECISAO_AVISO_M = 30;
export const PRECISAO_MAXIMA_M = 100;

const MENSAGENS = {
  negado: "Permissão de localização negada. Libere o acesso à localização no navegador e tente de novo.",
  indisponivel: "Não foi possível obter a localização. Verifique o GPS e tente de novo.",
  timeout: "Tempo esgotado ao obter a localização. Vá a céu aberto e tente de novo.",
  inseguro: "A localização só funciona em conexão segura (HTTPS).",
};

const metros = (n) => String(Math.round(n * 10) / 10).replace(".", ",");

/** Botão que captura o GPS e mostra coordenadas e precisão. `valor`: { lat, lng, precisao } | null. */
export default function CapturaLocalizacao({ valor, aoCapturar, desabilitado = false }) {
  const { estado, coords, capturar } = useGeolocalizacao();

  useEffect(() => {
    if (coords) aoCapturar(coords);
  }, [coords]);

  const capturando = estado === "capturando";
  const precisao = valor?.precisao;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" className="min-h-11" disabled={desabilitado || capturando} onClick={capturar}>
          <MapPin /> {capturando ? "Capturando..." : valor ? "Capturar de novo" : "Capturar localização"}
        </Button>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {capturando ? "Obtendo a posição do GPS..." : valor ? null : "Localização ainda não capturada."}
        </p>
      </div>

      {valor ? (
        <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm">
          <span>Latitude {Number(valor.lat).toFixed(7)}</span>
          <span>Longitude {Number(valor.lng).toFixed(7)}</span>
          {precisao != null ? <span>Precisão ±{metros(precisao)} m</span> : null}
        </p>
      ) : null}

      {MENSAGENS[estado] ? <Banner tom="perigo">{MENSAGENS[estado]}</Banner> : null}

      {precisao > PRECISAO_AVISO_M ? (
        <Banner tom={precisao > PRECISAO_MAXIMA_M ? "perigo" : "alerta"}>
          Precisão baixa (±{metros(precisao)} m).{" "}
          {precisao > PRECISAO_MAXIMA_M ? "Não é possível gravar: capture de novo, de preferência a céu aberto." : "Recomenda-se capturar de novo, de preferência a céu aberto."}
        </Banner>
      ) : null}
    </div>
  );
}

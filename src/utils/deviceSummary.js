// Resumo legível do client_info gravado pelo back-end nos logs de auditoria.
export function deviceSummary(info) {
  if (!info) return "";
  const browser = [info.browser, info.browser_version?.split(".")[0]].filter(Boolean).join(" ");
  const os = [info.os, info.os_version].filter(Boolean).join(" ");
  const device = [info.device_brand, info.device_model].filter(Boolean).join(" ");
  const kind = info.is_bot ? "robô/ferramenta" : info.device_type;
  return [browser, os, device, kind].filter(Boolean).join(" · ");
}

// Todas as informações capturadas, uma por linha (para tooltip/detalhe).
export function deviceDetails(info, ipOrigin) {
  if (!info && !ipOrigin) return "";
  const rep = info?.reported || {};
  const rows = [
    ["Localização do IP", ipOrigin],
    ["Navegador", [info?.browser, info?.browser_version].filter(Boolean).join(" ")],
    ["Sistema", [info?.os, info?.os_version].filter(Boolean).join(" ")],
    ["Aparelho", [info?.device_type, info?.device_brand, info?.device_model].filter(Boolean).join(" · ")],
    ["Robô/ferramenta", info?.is_bot ? "sim" : ""],
    ["Idioma", info?.language],
    ["Origem (Origin)", info?.origin],
    ["Página (Referer)", info?.referer],
    ["Host acessado", info?.host],
    ["Cadeia de proxies (X-Forwarded-For)", info?.forwarded_for],
    ["IP direto (REMOTE_ADDR)", info?.remote_addr],
    ["Fuso do aparelho", rep.tz],
    ["Tela", rep.screen],
    ["Janela", rep.viewport],
    ["Plataforma informada", [rep.platform, rep.platform_version].filter(Boolean).join(" ")],
    ["Modelo informado", rep.model],
    ["Arquitetura", [rep.arch, rep.bitness].filter(Boolean).join(" ")],
    ["Memória/Núcleos", [rep.mem && `${rep.mem} GB`, rep.cores && `${rep.cores} núcleos`].filter(Boolean).join(" · ")],
    ["Conexão", rep.conn],
    ["User-Agent", info?.user_agent],
  ];
  return rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
}

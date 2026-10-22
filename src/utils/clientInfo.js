// Dados técnicos do aparelho informados ao back-end (cabeçalho X-Client-Info) para a auditoria.
// O back-end trata tudo como declarado pelo cliente (pode ser falsificado). O endereço MAC
// não é acessível por navegadores.
let cached = null;

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

const collect = async () => {
  if (typeof window === "undefined") return {};

  const nav = window.navigator || {};
  const info = {
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${window.screen?.width}x${window.screen?.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio,
    lang: nav.language,
    platform: nav.userAgentData?.platform || nav.platform,
    mem: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
    touch: nav.maxTouchPoints,
    conn: nav.connection?.effectiveType,
    brands: nav.userAgentData?.brands?.map((b) => `${b.brand} ${b.version}`),
  };

  // Client Hints de alta entropia: modelo do aparelho (Android), versão real do Windows etc.
  if (nav.userAgentData?.getHighEntropyValues) {
    const high = await withTimeout(
      nav.userAgentData
        .getHighEntropyValues(["model", "platformVersion", "architecture", "bitness"])
        .catch(() => null),
      300
    );
    if (high) {
      info.model = high.model || undefined;
      info.platform_version = high.platformVersion || undefined;
      info.arch = high.architecture || undefined;
      info.bitness = high.bitness || undefined;
    }
  }

  return Object.fromEntries(Object.entries(info).filter(([, v]) => v !== undefined && v !== ""));
};

export async function getClientInfoHeader() {
  if (!cached) {
    try {
      cached = encodeURIComponent(JSON.stringify(await collect()));
    } catch (_) {
      cached = "";
    }
  }
  return cached;
}

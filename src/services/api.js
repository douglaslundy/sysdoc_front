import axios from "axios";
import { getClientInfoHeader } from "../utils/clientInfo";
import { lerAtiva, limparAtiva } from "../store/ducks/secretaria";

const normalize = (v) => String(v || "").trim().replace(/\/+$/, "");
const ensureApiSuffix = (value) => {
  const normalized = normalize(value);
  if (!normalized) return "";
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
};
const envBase = ensureApiSuffix(process.env.NEXT_PUBLIC_API_URL);
const apiBaseCandidates = [
  envBase,
  "http://127.0.0.1:8010/api",
  "http://localhost:8010/api",
].map(ensureApiSuffix).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

export const api = axios.create({
  baseURL: apiBaseCandidates[0],
});

// Envia dispositivo/fuso/tela ao back-end para a auditoria de acessos.
// config.semSecretaria: a requisição não leva X-Secretaria-Id (usado em /auth/secretarias,
// para que uma ativa obsoleta não impeça justamente de descobrir a ativa válida).
// Sessão com cookie de metadados mas sem token em memória (carga da página): espera o token
// do BFF em vez de disparar a requisição sem Authorization (que geraria 401 no console).
let tokenPendente = null;
function aguardarToken() {
  if (!tokenPendente) {
    tokenPendente = fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.token) setAuthToken(data.token); })
      .catch(() => {})
      .finally(() => { tokenPendente = null; });
  }
  return tokenPendente;
}
const sessaoAtiva = () => typeof document !== "undefined" && /(?:^|;\s*)sysvendas\.id=/.test(document.cookie);

export async function prepararRequisicao(config) {
  if (!config.publica && !api.defaults.headers["Authorization"] && !config.headers["Authorization"] && sessaoAtiva()) {
    await aguardarToken();
    if (api.defaults.headers["Authorization"]) config.headers["Authorization"] = api.defaults.headers["Authorization"];
  }
  const info = await getClientInfoHeader();
  if (info) config.headers["X-Client-Info"] = info;
  const secretaria = lerAtiva();
  if (secretaria && !config.semSecretaria && !config.publica) config.headers["X-Secretaria-Id"] = secretaria;
  // config.publica: endpoint sem sessão (cadastro público); nunca leva token.
  if (config.publica) delete config.headers["Authorization"];
  return config;
}
api.interceptors.request.use(prepararRequisicao);

// 403 por secretaria inválida: limpa a ativa e recarrega UMA vez (flag em sessionStorage,
// zerada quando /auth/secretarias responde com sucesso) para nunca entrar em loop.
const FLAG_RELOAD = "sysdoc.secretariaReload";
export function liberarGuardaSecretaria() {
  try { window.sessionStorage.removeItem(FLAG_RELOAD); } catch (_) {}
}
export function tratarErroSecretaria(error) {
  const msg = error?.response?.data?.message;
  if (error?.response?.status === 403 && typeof msg === "string" && msg.startsWith("Secretaria ") && lerAtiva()) {
    limparAtiva();
    try {
      if (window.sessionStorage.getItem(FLAG_RELOAD)) return Promise.reject(error);
      window.sessionStorage.setItem(FLAG_RELOAD, "1");
    } catch (_) {
      return Promise.reject(error);
    }
    window.location.reload();
  }
  return Promise.reject(error);
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers["Authorization"];
  }
}

// If a request fires before setAuthToken is called (race on page load),
// fetch the token from the BFF and retry once automatically.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Requisição cancelada (AbortController) não é erro de rede: repassa
    // imediatamente, senão o fallback de baseURL redirecionaria todo o
    // tráfego para localhost sempre que o usuário trocasse um filtro.
    if (axios.isCancel(error) || error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
      return Promise.reject(error);
    }

    const cfg = error.config || {};
    const currentBase = normalize(cfg.baseURL || api.defaults.baseURL);
    const currentIndex = apiBaseCandidates.indexOf(currentBase);
    const nextBase =
      currentIndex >= 0 && currentIndex < apiBaseCandidates.length - 1
        ? apiBaseCandidates[currentIndex + 1]
        : null;

    const notFoundWrongBackend =
      error.response?.status === 404 &&
      typeof error.response?.data?.message === "string" &&
      error.response.data.message.toLowerCase().includes("route api/");

    const networkError = !error.response;

    // Fallback de base só faz sentido em dev local sem NEXT_PUBLIC_API_URL;
    // em produção um erro de rede transitório não pode trocar o backend.
    if (!envBase && (networkError || notFoundWrongBackend) && nextBase && !cfg._baseRetry) {
      cfg._baseRetry = true;
      cfg.baseURL = nextBase;
      api.defaults.baseURL = nextBase;
      return api(cfg);
    }

    if (error.response?.status === 403) return tratarErroSecretaria(error);

    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setAuthToken(data.token);
          error.config.headers["Authorization"] = `Bearer ${data.token}`;
          return api(error.config);
        }
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

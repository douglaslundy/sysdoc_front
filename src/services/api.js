import axios from "axios";

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

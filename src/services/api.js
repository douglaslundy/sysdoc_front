import axios from "axios";

const normalize = (v) => String(v || "").trim().replace(/\/+$/, "");
const apiBaseCandidates = [
  normalize(process.env.NEXT_PUBLIC_API_URL),
  "http://127.0.0.1:8001/api",
  "http://127.0.0.1:8000/api",
  "http://localhost:8001/api",
  "http://localhost:8000/api",
].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

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

    if ((networkError || notFoundWrongBackend) && nextBase && !cfg._baseRetry) {
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

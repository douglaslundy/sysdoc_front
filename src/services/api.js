import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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

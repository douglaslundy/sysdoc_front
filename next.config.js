require("dotenv").config();

module.exports = {
    webpack: (config) => {
      config.resolve.fallback = {fs: false};
      return config;
    },
    // METABASE_JWT_SHARED_SECRET NUNCA deve entrar aqui: tudo em `env` é embutido também no bundle do client.
    // Use process.env.METABASE_JWT_SHARED_SECRET apenas em código server-side (ex: pages/api/*).
    env: {
        REACT_APP_API_URL:process.env.API_URL,
        METABASE_SITE_URL:process.env.METABASE_SITE_URL,
    },
}
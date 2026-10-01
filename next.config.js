require("dotenv").config();

module.exports = {
    webpack: (config) => {
      config.resolve.fallback = {fs: false};
      return config;
    },
    // Endereços antigos da denúncia pública (links já enviados) levam à nova página de petição.
    async redirects() {
      return [
        { source: "/denuncia", destination: "/petition", permanent: true },
        { source: "/denuncia/consulta", destination: "/petition/track", permanent: true },
      ];
    },
    // METABASE_JWT_SHARED_SECRET NUNCA deve entrar aqui: tudo em `env` é embutido também no bundle do client.
    // Use process.env.METABASE_JWT_SHARED_SECRET apenas em código server-side (ex: pages/api/*).
    env: {
        REACT_APP_API_URL:process.env.API_URL,
        METABASE_SITE_URL:process.env.METABASE_SITE_URL,
    },
}
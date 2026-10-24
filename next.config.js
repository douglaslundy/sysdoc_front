require("dotenv").config();

module.exports = {
    // @base-ui/react é ESM e importa 'react/jsx-runtime' sem extensão: no React 17 o Node não resolve isso no SSR.
    // esmExternals:false faz o webpack empacotar esses módulos em vez de exigi-los do node_modules.
    experimental: { esmExternals: false },
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
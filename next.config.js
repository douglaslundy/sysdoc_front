require("dotenv").config();

module.exports = {
    webpack: (config) => {
      config.resolve.fallback = {fs: false};
      return config;
    },
    env: {
        REACT_APP_API_URL:process.env.API_URL,
        METABASE_JWT_SHARED_SECRET:process.env. METABASE_JWT_SHARED_SECRET,
        METABASE_SITE_URL:process.env.METABASE_SITE_URL,
    },
    async rewrites() {
        const backendUrl = process.env.MONITOR_APS_BACKEND_URL || 'http://localhost:3001';
        return [
            {
                source: '/api/monitor-aps/:path*',
                destination: `${backendUrl}/api/monitor-aps/:path*`,
            },
        ];
    },
}
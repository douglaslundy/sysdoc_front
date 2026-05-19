require("dotenv").config();
const path = require("path");

module.exports = {
    webpack: (config) => {
      config.resolve.fallback = {fs: false};
      config.resolve.alias['@monitor-aps'] = path.resolve(
        __dirname,
        '../psf-dashboard-prompts/modules/monitor-aps/frontend/src'
      );
      return config;
    },
    env: {
        REACT_APP_API_URL:process.env.API_URL,
        METABASE_JWT_SHARED_SECRET:process.env. METABASE_JWT_SHARED_SECRET,
        METABASE_SITE_URL:process.env.METABASE_SITE_URL,
        MONITOR_APS_BACKEND_URL: process.env.MONITOR_APS_BACKEND_URL || 'http://localhost:3001',
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
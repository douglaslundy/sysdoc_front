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
}
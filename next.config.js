require("dotenv").config();

module.exports = {
    webpack: (config) => {
      config.resolve.fallback = {fs: false};
      return config; 
    },
    env: {
        REACT_APP_API_URL:process.env.API_URL,
    },
}
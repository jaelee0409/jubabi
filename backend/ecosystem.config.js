module.exports = {
  apps: [
    {
      name: "backend",
      script: "dist/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 5001,
        BACKEND_BASE_URL: "https://c6ba11b63547.ngrok-free.app",
      },
      env_preview: {
        NODE_ENV: "preview",
        PORT: 5001,
        BACKEND_BASE_URL: "http://3.37.181.124:5001",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5001,
        BACKEND_BASE_URL: "http://3.37.181.124:5001",
      },
    },
  ],
};

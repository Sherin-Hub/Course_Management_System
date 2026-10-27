// Central place to read configuration. dotenv is loaded in server.js first.
module.exports = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};

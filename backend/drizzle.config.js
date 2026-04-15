"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./src/config/env");
exports.default = {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env_1.ENV.NEON_DATABASE_URL,
  },
};

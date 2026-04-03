const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn(
    "DATABASE_URL is not set. Copy .env.example to .env and configure PostgreSQL."
  );
}

/** Render / Neon / most cloud Postgres require SSL; local Docker usually does not. */
function dialectOptionsForUrl(databaseUrl) {
  if (!databaseUrl) return {};
  if (process.env.DATABASE_SSL === "false") return {};
  if (process.env.DATABASE_SSL === "true") {
    return { ssl: { require: true, rejectUnauthorized: false } };
  }
  try {
    const u = new URL(databaseUrl);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1") return {};
  } catch {
    return {};
  }
  return { ssl: { require: true, rejectUnauthorized: false } };
}

const common = {
  url,
  dialect: "postgres",
  logging: false,
};

const production = {
  ...common,
  dialectOptions: dialectOptionsForUrl(url),
};

module.exports = {
  development: common,
  test: common,
  production,
};

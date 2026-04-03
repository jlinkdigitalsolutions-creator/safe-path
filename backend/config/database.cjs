const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn(
    "DATABASE_URL is not set. Copy .env.example to .env and configure PostgreSQL."
  );
}

const common = {
  url,
  dialect: "postgres",
  logging: false,
};

module.exports = {
  development: common,
  test: common,
  production: {
    ...common,
    dialectOptions:
      process.env.DATABASE_SSL === "true"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  },
};

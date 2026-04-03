import { Sequelize } from "sequelize";
import { env } from "./env.js";

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: env.nodeEnv === "development" ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

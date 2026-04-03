import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { sequelize } from "./config/database.js";
import { env } from "./config/env.js";
import "./database/models/index.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { caseRoutes } from "./modules/case-management/case.routes.js";
import { healthRoutes } from "./modules/health-support/health.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { notificationRoutes } from "./modules/notifications/notification.routes.js";
import { auditRoutes } from "./modules/audit/audit.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "safepath-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/case-management", caseRoutes);
app.use("/api/health-support", healthRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use(errorMiddleware);

async function main() {
  await sequelize.authenticate();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

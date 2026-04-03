import { AuditLog, User } from "../../database/models/index.js";

export async function listLogs(params: { page: number; pageSize: number }) {
  return AuditLog.findAndCountAll({
    order: [["createdAt", "DESC"]],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
    include: [
      {
        model: User,
        attributes: ["id", "email", "fullName"],
      },
    ],
  });
}

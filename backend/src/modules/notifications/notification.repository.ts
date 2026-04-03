import { Notification, User, Role } from "../../database/models/index.js";
import { Op } from "sequelize";

export async function createNotification(data: {
  userId: string;
  title: string;
  body: string;
  channel?: string;
  meta?: Record<string, unknown>;
}) {
  return Notification.create({
    userId: data.userId,
    title: data.title,
    body: data.body,
    channel: data.channel ?? "in_app",
    meta: data.meta ?? null,
  });
}

export async function listForUser(userId: string, page: number, pageSize: number) {
  return Notification.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
}

export async function markRead(id: string, userId: string) {
  const n = await Notification.findOne({ where: { id, userId } });
  if (!n) return null;
  await n.update({ read: true });
  return n;
}

export async function findUserIdsByRoleNames(roleNames: string[]) {
  const users = await User.findAll({
    attributes: ["id"],
    include: [
      {
        model: Role,
        where: { name: { [Op.in]: roleNames } },
        through: { attributes: [] },
        required: true,
      },
    ],
  });
  return users.map((u) => u.id);
}

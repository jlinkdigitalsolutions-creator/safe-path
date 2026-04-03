import { Op } from "sequelize";
import { User, Role, UserRole } from "../../database/models/index.js";
import { sequelize } from "../../config/database.js";

export async function listUsers() {
  return User.findAll({
    attributes: ["id", "email", "fullName", "phone", "isActive", "createdAt"],
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name", "description"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

export async function listRoles() {
  return Role.findAll({
    attributes: ["id", "name", "description"],
    order: [["name", "ASC"]],
  });
}

export async function findUserById(id: string) {
  return User.findByPk(id, {
    attributes: ["id", "email", "fullName", "phone", "isActive", "createdAt"],
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name", "description"],
      },
    ],
  });
}

export async function updateUserFields(
  id: string,
  fields: { fullName?: string; phone?: string | null; isActive?: boolean }
) {
  const [count] = await User.update(fields, { where: { id } });
  return count > 0;
}

export async function replaceUserRoles(userId: string, roleIds: string[]) {
  await sequelize.transaction(async (t) => {
    await UserRole.destroy({ where: { userId }, transaction: t });
    if (roleIds.length === 0) return;
    await UserRole.bulkCreate(
      roleIds.map((roleId) => ({ userId, roleId })),
      { transaction: t }
    );
  });
}

export async function findRoleIdsByNames(names: string[]) {
  if (names.length === 0) return [];
  const roles = await Role.findAll({
    where: { name: { [Op.in]: names } },
    attributes: ["id", "name"],
  });
  return roles;
}

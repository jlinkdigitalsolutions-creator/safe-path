import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export class RolePermission extends Model<
  InferAttributes<RolePermission>,
  InferCreationAttributes<RolePermission>
> {
  declare id: CreationOptional<string>;
  declare roleId: string;
  declare permissionId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RolePermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "roles", key: "id" },
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "permissions", key: "id" },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "role_permissions", modelName: "RolePermission" }
);

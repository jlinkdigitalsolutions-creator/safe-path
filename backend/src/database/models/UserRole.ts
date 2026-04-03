import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export class UserRole extends Model<
  InferAttributes<UserRole>,
  InferCreationAttributes<UserRole>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare roleId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserRole.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "roles", key: "id" },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "user_roles", modelName: "UserRole" }
);

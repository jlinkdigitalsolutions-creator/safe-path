import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  declare id: CreationOptional<string>;
  declare userId: string | null;
  declare action: string;
  declare entityType: string;
  declare entityId: string | null;
  declare details: Record<string, unknown> | null;
  declare ipAddress: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    action: { type: DataTypes.STRING(128), allowNull: false },
    entityType: { type: DataTypes.STRING(64), allowNull: false },
    entityId: { type: DataTypes.UUID, allowNull: true },
    details: { type: DataTypes.JSONB, allowNull: true },
    ipAddress: { type: DataTypes.STRING(64), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "audit_logs", modelName: "AuditLog" }
);

import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export const REFERRAL_TYPES = ["shelter", "legal", "health", "police"] as const;
export const REFERRAL_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export class Referral extends Model<
  InferAttributes<Referral>,
  InferCreationAttributes<Referral>
> {
  declare id: CreationOptional<string>;
  declare caseId: string;
  declare type: (typeof REFERRAL_TYPES)[number];
  declare status: (typeof REFERRAL_STATUSES)[number];
  declare destinationName: string | null;
  declare notes: string | null;
  declare createdById: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Referral.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    caseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "cases", key: "id" },
    },
    type: { type: DataTypes.ENUM(...REFERRAL_TYPES), allowNull: false },
    status: {
      type: DataTypes.ENUM(...REFERRAL_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    destinationName: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "referrals", modelName: "Referral" }
);

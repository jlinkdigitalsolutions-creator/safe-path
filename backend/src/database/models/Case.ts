import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export const CASE_TYPES = ["rape", "physical", "emotional"] as const;
/** Workflow: triage → active work → external handoff → outcome → archive */
export const CASE_STATUSES = [
  "open",
  "in_progress",
  "forwarded",
  "resolved",
  "closed",
] as const;
export const URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;

export class Case extends Model<
  InferAttributes<Case>,
  InferCreationAttributes<Case>
> {
  declare id: CreationOptional<string>;
  declare caseNumber: string;
  declare type: (typeof CASE_TYPES)[number];
  declare country: CreationOptional<string>;
  declare region: string;
  declare district: string;
  declare kebele: string;
  declare urgency: (typeof URGENCY_LEVELS)[number];
  declare status: (typeof CASE_STATUSES)[number];
  declare anonymous: CreationOptional<boolean>;
  declare reportedById: string | null;
  declare intakeChannel: CreationOptional<string>;
  declare summary: string | null;
  declare locationNotes: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Case.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    caseNumber: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    country: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "Ethiopia" },
    type: {
      type: DataTypes.ENUM(...CASE_TYPES),
      allowNull: false,
    },
    region: { type: DataTypes.STRING(128), allowNull: false },
    district: { type: DataTypes.STRING(128), allowNull: false },
    kebele: { type: DataTypes.STRING(128), allowNull: false },
    urgency: {
      type: DataTypes.ENUM(...URGENCY_LEVELS),
      allowNull: false,
      defaultValue: "medium",
    },
    status: {
      type: DataTypes.ENUM(...CASE_STATUSES),
      allowNull: false,
      defaultValue: "open",
    },
    anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
    reportedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    intakeChannel: { type: DataTypes.STRING(32), defaultValue: "web" },
    summary: { type: DataTypes.TEXT, allowNull: true },
    locationNotes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "cases", modelName: "Case" }
);

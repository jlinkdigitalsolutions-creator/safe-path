import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export class CaseAssignment extends Model<
  InferAttributes<CaseAssignment>,
  InferCreationAttributes<CaseAssignment>
> {
  declare id: CreationOptional<string>;
  declare caseId: string;
  declare assigneeId: string;
  declare assignedById: string | null;
  declare notes: string | null;
  declare active: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CaseAssignment.init(
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
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    assignedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "case_assignments", modelName: "CaseAssignment" }
);

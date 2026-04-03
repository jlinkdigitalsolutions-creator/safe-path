import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export class HealthMessage extends Model<
  InferAttributes<HealthMessage>,
  InferCreationAttributes<HealthMessage>
> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare body: string;
  declare channel: string;
  declare audience: string;
  declare topic: CreationOptional<string>;
  declare language: CreationOptional<string>;
  declare reachEstimate: CreationOptional<number>;
  declare sentAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

HealthMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    channel: { type: DataTypes.STRING(32), allowNull: false },
    audience: { type: DataTypes.STRING(128), allowNull: false },
    topic: { type: DataTypes.STRING(64), defaultValue: "general" },
    language: { type: DataTypes.STRING(32), defaultValue: "en" },
    reachEstimate: { type: DataTypes.INTEGER, defaultValue: 0 },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "health_messages", modelName: "HealthMessage" }
);

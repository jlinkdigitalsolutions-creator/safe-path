import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export const FACILITY_TYPES = [
  "clinic",
  "hospital",
  "ngo",
  "community_center",
] as const;

export class Facility extends Model<
  InferAttributes<Facility>,
  InferCreationAttributes<Facility>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare type: (typeof FACILITY_TYPES)[number];
  declare country: CreationOptional<string>;
  declare region: string;
  declare district: string;
  declare address: string | null;
  declare phone: string | null;
  declare latitude: number | null;
  declare longitude: number | null;
  declare services: string[] | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Facility.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.ENUM(...FACILITY_TYPES), allowNull: false },
    country: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "Ethiopia" },
    region: { type: DataTypes.STRING(128), allowNull: false },
    district: { type: DataTypes.STRING(128), allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    phone: { type: DataTypes.STRING(64), allowNull: true },
    latitude: { type: DataTypes.DOUBLE, allowNull: true },
    longitude: { type: DataTypes.DOUBLE, allowNull: true },
    services: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "facilities", modelName: "Facility" }
);

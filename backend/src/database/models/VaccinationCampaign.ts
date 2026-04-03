import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database.js";

export class VaccinationCampaign extends Model<
  InferAttributes<VaccinationCampaign>,
  InferCreationAttributes<VaccinationCampaign>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare region: string;
  declare startDate: Date;
  declare endDate: Date | null;
  declare targetCoveragePercent: number;
  declare currentCoveragePercent: CreationOptional<number>;
  declare status: CreationOptional<string>;
  declare ageMin: CreationOptional<number>;
  declare ageMax: CreationOptional<number>;
  declare smsReminderEnabled: CreationOptional<boolean>;
  declare targetDistricts: string | null;
  declare language: CreationOptional<string>;
  declare eligiblePopulation: CreationOptional<number | null>;
  declare vaccinatedCount: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

VaccinationCampaign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    region: { type: DataTypes.STRING(128), allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    targetCoveragePercent: { type: DataTypes.INTEGER, allowNull: false },
    currentCoveragePercent: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING(32), defaultValue: "active" },
    ageMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 9 },
    ageMax: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 45 },
    smsReminderEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    targetDistricts: { type: DataTypes.TEXT, allowNull: true },
    language: { type: DataTypes.STRING(32), defaultValue: "en" },
    eligiblePopulation: { type: DataTypes.INTEGER, allowNull: true },
    vaccinatedCount: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "vaccination_campaigns",
    modelName: "VaccinationCampaign",
  }
);

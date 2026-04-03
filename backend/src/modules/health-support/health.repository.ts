import { Op } from "sequelize";
import {
  VaccinationCampaign,
  HealthMessage,
  Facility,
} from "../../database/models/index.js";

export async function listCampaigns() {
  return VaccinationCampaign.findAll({ order: [["startDate", "DESC"]] });
}

export async function getCampaign(id: string) {
  return VaccinationCampaign.findByPk(id);
}

export async function listMessages() {
  return HealthMessage.findAll({ order: [["createdAt", "DESC"]] });
}

export async function getMessage(id: string) {
  return HealthMessage.findByPk(id);
}

export async function listFacilities(params: {
  region?: string;
  type?: string;
  country?: string;
  service?: string;
}) {
  const where: Record<string, unknown> = {};
  if (params.region) where.region = { [Op.iLike]: `%${params.region}%` };
  if (params.type) where.type = params.type;
  if (params.country) where.country = { [Op.iLike]: `%${params.country}%` };
  const rows = await Facility.findAll({
    where,
    order: [["name", "ASC"]],
  });
  if (!params.service) return rows;
  const s = params.service.toLowerCase();
  return rows.filter((f) =>
    (f.services ?? []).some((x) => x.toLowerCase().includes(s))
  );
}

export async function getFacility(id: string) {
  return Facility.findByPk(id);
}

export async function createCampaign(data: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize create typings
  return VaccinationCampaign.create(data as any);
}

export async function updateCampaign(id: string, data: Record<string, unknown>) {
  const row = await VaccinationCampaign.findByPk(id);
  if (!row) return null;
  await row.update(data);
  return row;
}

export async function deleteCampaign(id: string) {
  return VaccinationCampaign.destroy({ where: { id } });
}

export async function createMessage(data: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize create typings
  return HealthMessage.create(data as any);
}

export async function updateMessage(id: string, data: Record<string, unknown>) {
  const row = await HealthMessage.findByPk(id);
  if (!row) return null;
  await row.update(data);
  return row;
}

export async function deleteMessage(id: string) {
  return HealthMessage.destroy({ where: { id } });
}

export async function createFacility(data: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize create typings
  return Facility.create(data as any);
}

export async function updateFacility(id: string, data: Record<string, unknown>) {
  const row = await Facility.findByPk(id);
  if (!row) return null;
  await row.update(data);
  return row;
}

export async function deleteFacility(id: string) {
  return Facility.destroy({ where: { id } });
}

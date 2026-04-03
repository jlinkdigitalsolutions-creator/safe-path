import {
  Op,
  fn,
  col,
  type WhereOptions,
} from "sequelize";
import {
  Case,
  CaseAssignment,
  Referral,
  User,
  Role,
} from "../../database/models/index.js";
import type { CASE_STATUSES, CASE_TYPES, URGENCY_LEVELS } from "../../database/models/Case.js";
import { REFERRAL_STATUSES } from "../../database/models/Referral.js";

export type CaseListFilters = {
  search?: string;
  status?: (typeof CASE_STATUSES)[number];
  type?: (typeof CASE_TYPES)[number];
  region?: string;
  district?: string;
  country?: string;
  urgency?: (typeof URGENCY_LEVELS)[number];
  /** When set, only cases with an active assignment to this user. */
  assigneeId?: string;
};

export async function createCase(data: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize create typings
  return Case.create(data as any);
}

export async function findCaseById(id: string) {
  return Case.findByPk(id, {
    include: [
      { model: User, as: "Reporter", attributes: ["id", "email", "fullName", "phone"] },
      {
        model: CaseAssignment,
        include: [
          {
            model: User,
            as: "Assignee",
            attributes: ["id", "email", "fullName", "phone"],
          },
        ],
      },
      { model: Referral },
    ],
  });
}

export async function listCases(params: {
  page: number;
  pageSize: number;
  filters: CaseListFilters;
}) {
  const { page, pageSize, filters } = params;
  const parts: WhereOptions[] = [];
  if (filters.status) parts.push({ status: filters.status });
  if (filters.type) parts.push({ type: filters.type });
  if (filters.region)
    parts.push({ region: { [Op.iLike]: `%${filters.region}%` } });
  if (filters.district)
    parts.push({ district: { [Op.iLike]: `%${filters.district}%` } });
  if (filters.country)
    parts.push({ country: { [Op.iLike]: `%${filters.country}%` } });
  if (filters.urgency) parts.push({ urgency: filters.urgency });
  if (filters.search) {
    const q = `%${filters.search}%`;
    parts.push({
      [Op.or]: [
        { caseNumber: { [Op.iLike]: q } },
        { summary: { [Op.iLike]: q } },
        { district: { [Op.iLike]: q } },
        { region: { [Op.iLike]: q } },
      ],
    });
  }
  const where: WhereOptions =
    parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { [Op.and]: parts };

  const assigneeId = filters.assigneeId;
  const assignmentInclude = {
    model: CaseAssignment,
    where: assigneeId
      ? { active: true, assigneeId }
      : { active: true },
    required: !!assigneeId,
    include: [
      {
        model: User,
        as: "Assignee",
        attributes: ["id", "fullName", "email"],
      },
    ],
  };

  return Case.findAndCountAll({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [["createdAt", "DESC"]],
    include: [assignmentInclude],
  });
}

export async function findCasesForExport(filters: CaseListFilters, maxRows: number) {
  const parts: WhereOptions[] = [];
  if (filters.status) parts.push({ status: filters.status });
  if (filters.type) parts.push({ type: filters.type });
  if (filters.region)
    parts.push({ region: { [Op.iLike]: `%${filters.region}%` } });
  if (filters.district)
    parts.push({ district: { [Op.iLike]: `%${filters.district}%` } });
  if (filters.country)
    parts.push({ country: { [Op.iLike]: `%${filters.country}%` } });
  if (filters.urgency) parts.push({ urgency: filters.urgency });
  if (filters.search) {
    const q = `%${filters.search}%`;
    parts.push({
      [Op.or]: [
        { caseNumber: { [Op.iLike]: q } },
        { summary: { [Op.iLike]: q } },
        { district: { [Op.iLike]: q } },
      ],
    });
  }
  const where: WhereOptions =
    parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { [Op.and]: parts };

  return Case.findAll({
    where,
    limit: maxRows,
    order: [["createdAt", "DESC"]],
    attributes: [
      "id",
      "caseNumber",
      "country",
      "region",
      "district",
      "kebele",
      "type",
      "urgency",
      "status",
      "anonymous",
      "intakeChannel",
      "summary",
      "createdAt",
    ],
  });
}

export async function updateCase(
  id: string,
  data: Partial<{
    status: (typeof CASE_STATUSES)[number];
    urgency: (typeof URGENCY_LEVELS)[number];
    summary: string | null;
    locationNotes: string | null;
    region: string;
    district: string;
    kebele: string;
    country: string;
    type: (typeof CASE_TYPES)[number];
  }>
) {
  const c = await Case.findByPk(id);
  if (!c) return null;
  await c.update(data);
  return c;
}

export async function deleteCaseById(id: string): Promise<number> {
  return Case.destroy({ where: { id } });
}

export async function addAssignment(data: {
  caseId: string;
  assigneeId: string;
  assignedById: string | null;
  notes?: string | null;
}) {
  await CaseAssignment.update(
    { active: false },
    { where: { caseId: data.caseId, active: true } }
  );
  return CaseAssignment.create({
    caseId: data.caseId,
    assigneeId: data.assigneeId,
    assignedById: data.assignedById,
    notes: data.notes ?? null,
    active: true,
  });
}

export async function createReferral(data: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize create typings
  return Referral.create(data as any);
}

export async function updateReferral(
  id: string,
  data: Partial<{
    status: (typeof REFERRAL_STATUSES)[number];
    notes: string | null;
    destinationName: string | null;
  }>
) {
  const r = await Referral.findByPk(id);
  if (!r) return null;
  await r.update(data);
  return r;
}

export async function countByGroup(
  field: "region" | "type" | "status" | "urgency" | "district" | "country"
) {
  const rows = await Case.findAll({
    attributes: [field, [fn("COUNT", col("id")), "count"]],
    group: [field],
    raw: true,
  });
  return rows as unknown as Record<string, string | number>[];
}

export async function countSurvivorsReceivingSupport() {
  return Case.count({
    where: {
      status: { [Op.in]: ["open", "in_progress", "forwarded", "resolved"] },
    },
  });
}

export async function referralOutcomeCounts() {
  const rows = await Referral.findAll({
    attributes: ["status", [fn("COUNT", col("id")), "count"]],
    group: ["status"],
    raw: true,
  });
  return rows as unknown as { status: string; count: string }[];
}

export async function referralCountsByType() {
  const rows = await Referral.findAll({
    attributes: ["type", [fn("COUNT", col("id")), "count"]],
    group: ["type"],
    raw: true,
  });
  return rows as unknown as { type: string; count: string }[];
}

export async function listReferrals(params: {
  page: number;
  pageSize: number;
  filters: {
    search?: string;
    status?: string;
    type?: string;
  };
}) {
  const { page, pageSize, filters } = params;
  const refParts: WhereOptions[] = [];
  if (filters.status) refParts.push({ status: filters.status });
  if (filters.type) refParts.push({ type: filters.type });
  const referralWhere: WhereOptions =
    refParts.length === 0
      ? {}
      : refParts.length === 1
        ? refParts[0]!
        : { [Op.and]: refParts };

  const caseInclude: {
    model: typeof Case;
    attributes: string[];
    required: true;
    where?: WhereOptions;
  } = {
    model: Case,
    attributes: ["id", "caseNumber", "region", "district", "urgency", "status", "type"],
    required: true,
  };
  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    caseInclude.where = {
      [Op.or]: [
        { caseNumber: { [Op.iLike]: q } },
        { district: { [Op.iLike]: q } },
        { region: { [Op.iLike]: q } },
      ],
    };
  }

  return Referral.findAndCountAll({
    where: referralWhere,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [["updatedAt", "DESC"]],
    include: [caseInclude],
  });
}

export async function getActiveAssigneeIdsForCase(caseId: string): Promise<string[]> {
  const rows = await CaseAssignment.findAll({
    where: { caseId, active: true },
    attributes: ["assigneeId"],
  });
  return rows.map((r) => r.assigneeId);
}

const ASSIGNABLE_ROLE_NAMES = [
  "admin",
  "social_worker",
  "police",
  "ngo_staff",
  "legal_counsel",
] as const;

export async function listAssignableUsers() {
  const rows = await User.findAll({
    attributes: ["id", "email", "fullName"],
    where: { isActive: true },
    include: [
      {
        model: Role,
        attributes: ["name"],
        through: { attributes: [] },
        required: false,
      },
    ],
    order: [["fullName", "ASC"]],
  });
  return rows.filter((u) =>
    (u as { Roles?: { name: string }[] }).Roles?.some((r) =>
      (ASSIGNABLE_ROLE_NAMES as readonly string[]).includes(r.name)
    )
  );
}

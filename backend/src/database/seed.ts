import { config } from "dotenv";
import { sequelize } from "../config/database.js";
import "../database/models/index.js";
import {
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
  Case,
  Referral,
  VaccinationCampaign,
  HealthMessage,
  Facility,
} from "./models/index.js";
import { hashPassword } from "../shared/utils/password.js";
import { PERMISSIONS } from "../shared/constants/permissions.js";

config();

const ROLE_DEFS: { name: string; description: string; permissions: string[] }[] =
  [
    {
      name: "admin",
      description: "Full system access",
      permissions: [...PERMISSIONS],
    },
    {
      name: "social_worker",
      description: "Case intake and management",
      permissions: [
        "case:create",
        "case:read",
        "case:update",
        "case:assign",
        "case:refer",
        "notifications:read",
        "dashboard:view",
      ],
    },
    {
      name: "police",
      description: "Case read and referral",
      permissions: [
        "case:read",
        "case:update",
        "case:refer",
        "notifications:read",
        "dashboard:view",
      ],
    },
    {
      name: "ngo_staff",
      description: "NGO case support",
      permissions: [
        "case:create",
        "case:read",
        "case:update",
        "case:refer",
        "notifications:read",
        "dashboard:view",
      ],
    },
    {
      name: "health_officer",
      description: "Women's health modules",
      permissions: [
        "health:read",
        "health:create",
        "health:update",
        "notifications:read",
        "dashboard:view",
      ],
    },
    {
      name: "legal_counsel",
      description: "Legal referral follow-up and case notes",
      permissions: [
        "case:read",
        "case:update",
        "case:refer",
        "notifications:read",
        "dashboard:view",
      ],
    },
    {
      name: "viewer",
      description: "Read-only dashboards",
      permissions: ["case:read", "health:read", "dashboard:view", "notifications:read"],
    },
  ];

async function seed() {
  await sequelize.authenticate();

  const permRecords = new Map<string, Permission>();
  for (const key of PERMISSIONS) {
    const [module, action] = key.split(":");
    const [p] = await Permission.findOrCreate({
      where: { key },
      defaults: {
        key,
        module: module ?? "general",
        action: action ?? "read",
        description: key,
      },
    });
    permRecords.set(key, p);
  }

  for (const rd of ROLE_DEFS) {
    const [role] = await Role.findOrCreate({
      where: { name: rd.name },
      defaults: { name: rd.name, description: rd.description },
    });
    for (const pk of rd.permissions) {
      const perm = permRecords.get(pk);
      if (!perm) continue;
      await RolePermission.findOrCreate({
        where: { roleId: role.id, permissionId: perm.id },
        defaults: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  const adminRole = await Role.findOne({ where: { name: "admin" } });
  if (!adminRole) throw new Error("admin role missing");

  const demoPassword = "Password123!";
  const hash = await hashPassword(demoPassword);

  const [adminUser] = await User.findOrCreate({
    where: { email: "admin@safepath.local" },
    defaults: {
      email: "admin@safepath.local",
      passwordHash: hash,
      fullName: "System Admin",
      phone: "+251900000001",
      isActive: true,
    },
  });
  await UserRole.findOrCreate({
    where: { userId: adminUser.id, roleId: adminRole.id },
    defaults: { userId: adminUser.id, roleId: adminRole.id },
  });

  const swRole = await Role.findOne({ where: { name: "social_worker" } });
  if (swRole) {
    const [sw] = await User.findOrCreate({
      where: { email: "social@safepath.local" },
      defaults: {
        email: "social@safepath.local",
        passwordHash: hash,
        fullName: "Yosef Mekonnen",
        phone: "+251900000002",
        isActive: true,
      },
    });
    await UserRole.findOrCreate({
      where: { userId: sw.id, roleId: swRole.id },
      defaults: { userId: sw.id, roleId: swRole.id },
    });
  }

  const hoRole = await Role.findOne({ where: { name: "health_officer" } });
  if (hoRole) {
    const [ho] = await User.findOrCreate({
      where: { email: "health@safepath.local" },
      defaults: {
        email: "health@safepath.local",
        passwordHash: hash,
        fullName: "Dr. Liya Tadesse",
        phone: "+251900000003",
        isActive: true,
      },
    });
    await UserRole.findOrCreate({
      where: { userId: ho.id, roleId: hoRole.id },
      defaults: { userId: ho.id, roleId: hoRole.id },
    });
  }

  const policeRole = await Role.findOne({ where: { name: "police" } });
  if (policeRole) {
    const [pu] = await User.findOrCreate({
      where: { email: "police@safepath.local" },
      defaults: {
        email: "police@safepath.local",
        passwordHash: hash,
        fullName: "Cmdr. Dawit Hailu",
        phone: "+251900000004",
        isActive: true,
      },
    });
    await UserRole.findOrCreate({
      where: { userId: pu.id, roleId: policeRole.id },
      defaults: { userId: pu.id, roleId: policeRole.id },
    });
  }

  const legalRole = await Role.findOne({ where: { name: "legal_counsel" } });
  if (legalRole) {
    const [lu] = await User.findOrCreate({
      where: { email: "legal@safepath.local" },
      defaults: {
        email: "legal@safepath.local",
        passwordHash: hash,
        fullName: "Alem Tesfaye",
        phone: "+251900000005",
        isActive: true,
      },
    });
    await UserRole.findOrCreate({
      where: { userId: lu.id, roleId: legalRole.id },
      defaults: { userId: lu.id, roleId: legalRole.id },
    });
  }

  const caseCount = await Case.count();
  if (caseCount === 0) {
    const c1 = await Case.create({
      caseNumber: `SP-${new Date().getFullYear()}-DEMO01`,
      country: "Ethiopia",
      type: "physical",
      region: "Addis Ababa",
      district: "Bole",
      kebele: "03/18",
      urgency: "high",
      status: "forwarded",
      anonymous: false,
      reportedById: adminUser.id,
      intakeChannel: "web",
      summary: "Initial report — follow-up scheduled",
      locationNotes: "Near public transport hub",
    } as never);
    await Referral.create({
      caseId: c1.id,
      type: "legal",
      status: "in_progress",
      destinationName: "Legal Aid Desk",
      notes: "Consultation booked",
      createdById: adminUser.id,
    } as never);

    await Case.create({
      caseNumber: `SP-${new Date().getFullYear()}-DEMO02`,
      country: "Ethiopia",
      type: "emotional",
      region: "Oromia",
      district: "Adama",
      kebele: "07",
      urgency: "medium",
      status: "open",
      anonymous: true,
      reportedById: null,
      intakeChannel: "sms",
      summary: "Anonymous SMS intake simulation",
      locationNotes: null,
    } as never);
  }

  if ((await VaccinationCampaign.count()) === 0) {
    await VaccinationCampaign.create({
      name: "HPV outreach — Q1",
      region: "Addis Ababa",
      startDate: new Date(`${new Date().getFullYear()}-01-15`),
      endDate: new Date(`${new Date().getFullYear()}-03-30`),
      targetCoveragePercent: 85,
      eligiblePopulation: 10_000,
      vaccinatedCount: 6200,
      currentCoveragePercent: 62,
      status: "active",
      ageMin: 9,
      ageMax: 45,
      smsReminderEnabled: true,
      targetDistricts: "Bole, Kirkos",
      language: "am",
    } as never);

    await HealthMessage.create({
      title: "Cervical screening awareness",
      body: "Free screening this month at partner clinics. Reply STOP to opt out.",
      channel: "sms",
      audience: "women_25_49",
      topic: "cervical_cancer",
      language: "am",
      reachEstimate: 12000,
      sentAt: new Date(),
    } as never);

    await Facility.create({
      name: "Bole Family Health Center",
      type: "clinic",
      country: "Ethiopia",
      region: "Addis Ababa",
      district: "Bole",
      address: "Cameroon St",
      phone: "+251911000000",
      latitude: 9.0054,
      longitude: 38.7636,
      services: [
        "cervical_screening",
        "cervical_treatment",
        "breast_screening",
        "breast_diagnosis",
        "vaccination",
      ],
    } as never);
  }

  console.log("Seed complete.");
  console.log("Demo logins (password for all):", demoPassword);
  console.log("  admin@safepath.local");
  console.log("  social@safepath.local");
  console.log("  health@safepath.local");
  console.log("  police@safepath.local");
  console.log("  legal@safepath.local");
}

seed()
  .then(() => sequelize.close())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

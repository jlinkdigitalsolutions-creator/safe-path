import { User } from "./User.js";
import { Role } from "./Role.js";
import { Permission } from "./Permission.js";
import { UserRole } from "./UserRole.js";
import { RolePermission } from "./RolePermission.js";
import { RefreshToken } from "./RefreshToken.js";
import { Case } from "./Case.js";
import { CaseAssignment } from "./CaseAssignment.js";
import { Referral } from "./Referral.js";
import { Notification } from "./Notification.js";
import { AuditLog } from "./AuditLog.js";
import { VaccinationCampaign } from "./VaccinationCampaign.js";
import { HealthMessage } from "./HealthMessage.js";
import { Facility } from "./Facility.js";

User.belongsToMany(Role, { through: UserRole, foreignKey: "userId" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId" });

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
});

User.hasMany(UserRole, { foreignKey: "userId" });
UserRole.belongsTo(User, { foreignKey: "userId" });
UserRole.belongsTo(Role, { foreignKey: "roleId" });

User.hasMany(RefreshToken, { foreignKey: "userId" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Case, { foreignKey: "reportedById", as: "ReportedCases" });
Case.belongsTo(User, { foreignKey: "reportedById", as: "Reporter" });

Case.hasMany(CaseAssignment, { foreignKey: "caseId" });
CaseAssignment.belongsTo(Case, { foreignKey: "caseId" });
CaseAssignment.belongsTo(User, { foreignKey: "assigneeId", as: "Assignee" });
CaseAssignment.belongsTo(User, { foreignKey: "assignedById", as: "Assigner" });

Case.hasMany(Referral, { foreignKey: "caseId" });
Referral.belongsTo(Case, { foreignKey: "caseId" });
Referral.belongsTo(User, { foreignKey: "createdById", as: "Creator" });

User.hasMany(Notification, { foreignKey: "userId" });
Notification.belongsTo(User, { foreignKey: "userId" });

User.hasMany(AuditLog, { foreignKey: "userId" });
AuditLog.belongsTo(User, { foreignKey: "userId" });

export {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  RefreshToken,
  Case,
  CaseAssignment,
  Referral,
  Notification,
  AuditLog,
  VaccinationCampaign,
  HealthMessage,
  Facility,
};

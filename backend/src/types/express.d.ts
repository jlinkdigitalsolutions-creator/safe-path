import type { PermissionKey } from "../shared/constants/permissions.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        roles: string[];
        permissions: PermissionKey[];
      };
    }
  }
}

export {};

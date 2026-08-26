import type { User as PrismaUser } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface User extends PrismaUser {}
    interface Request {
      userId?: string;
      blockedIds?: Set<string>;
    }
  }
}

export {};

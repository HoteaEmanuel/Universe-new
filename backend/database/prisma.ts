import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// node-postgres defaults to a pool of 10, which the k6 load test showed
// queuing badly past ~100 concurrent requests. DATABASE_URL already points
// at Neon's pooler endpoint (the "-pooler" host), which fronts far more
// concurrent connections than that, so raising this is safe.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 30,
});

export const prisma = new PrismaClient({ adapter });

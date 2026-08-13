import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({ path: path.join(import.meta.dirname, "backend", ".env") });

export default defineConfig({
  schema: path.join("backend", "prisma", "schema.prisma"),
  migrations: {
    path: path.join("backend", "prisma", "migrations"),
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});

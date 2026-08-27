import bcryptjs from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./backend/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const email = "wizardtest_local@example.com";
const password = "TestPass123!";
const hashed = await bcryptjs.hash(password, 10);

await prisma.user.deleteMany({ where: { email } });
const user = await prisma.user.create({
  data: {
    email,
    username: "wizardtest_local",
    firstName: "Wizard",
    lastName: "Test",
    name: "Wizard Test",
    password: hashed,
    isVerified: true,
    hasCompletedOnboarding: true,
    hasSeenAppTour: true,
  },
});

console.log(JSON.stringify({ email, password, id: user.id }));
await prisma.$disconnect();

import { prisma } from "./prisma.js";

export const connectToDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("CONNECTED TO DB");
  } catch (error) {
    console.log("Couldnt connect to db");
    console.log(error);
    process.exit(1);
  }
};

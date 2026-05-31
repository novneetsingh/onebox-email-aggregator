import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import logger from "../utils/logger";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export const checkDbConnection = async () => {
  try {
    await prisma.$connect();
    logger.info("✅ Database connection established");
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

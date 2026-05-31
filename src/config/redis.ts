import Redis from "ioredis";
import logger from "../utils/logger";

export const redisClient = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const checkRedisConnection = async () => {
  try {
    await redisClient.ping();
    logger.info("✅ Redis connection established");
  } catch (error) {
    logger.error("❌ Redis connection failed:", error);
    process.exit(1);
  }
};

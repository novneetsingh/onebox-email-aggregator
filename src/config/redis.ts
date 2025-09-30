import Redis from "ioredis";

const redis = new Redis({
  password: process.env.REDIS_PASSWORD!,
  host: process.env.REDIS_HOST!,
  port: Number(process.env.REDIS_PORT!),
  maxRetriesPerRequest: null,
});

export default redis;

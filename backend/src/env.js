import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 4000),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_ORIGIN:
    process.env.CLIENT_ORIGIN || process.env.CORS_ORIGIN || "http://localhost:5173",
};

export function requireEnv() {
  const missing = [];
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!env.JWT_SECRET) missing.push("JWT_SECRET");
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
}


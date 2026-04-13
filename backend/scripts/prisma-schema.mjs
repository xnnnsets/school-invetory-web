import path from "node:path";
import process from "node:process";

function inferProviderFromUrl(url) {
  if (!url) return null;
  const u = String(url).toLowerCase();
  if (u.startsWith("postgres://") || u.startsWith("postgresql://")) return "postgresql";
  if (u.startsWith("mysql://")) return "mysql";
  if (u.startsWith("file:")) return "sqlite";
  return null;
}

export function getPrismaProvider() {
  const explicit = process.env.DB_PROVIDER ? String(process.env.DB_PROVIDER).toLowerCase() : null;
  if (explicit) {
    if (explicit === "postgres" || explicit === "postgresql") return "postgresql";
    if (explicit === "mysql") return "mysql";
    if (explicit === "sqlite") return "sqlite";
  }
  return inferProviderFromUrl(process.env.DATABASE_URL) || "postgresql";
}

export function getSchemaPath() {
  const provider = getPrismaProvider();
  const file = `schema.${provider}.prisma`;
  return path.join(process.cwd(), "prisma", file);
}


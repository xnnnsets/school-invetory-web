import { spawnSync } from "node:child_process";
import process from "node:process";
import { getSchemaPath } from "./prisma-schema.mjs";

const args = process.argv.slice(2);
const schema = getSchemaPath();

const res = spawnSync("npx", ["prisma", ...args, "--schema", schema], {
  stdio: "inherit",
  env: process.env,
});

process.exit(res.status ?? 1);


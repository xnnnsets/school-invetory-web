import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma.js";

async function upsertSchool() {
  const existing = await prisma.school.findFirst();
  if (existing) return existing;
  return prisma.school.create({
    data: {
      name: "Sekolah Contoh",
      address: "Alamat sekolah",
      phone: "000000",
    },
  });
}

async function upsertUser({ name, email, role }) {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, isActive: true },
    create: { name, email, role, passwordHash },
  });
}

async function main() {
  await upsertSchool();
  await upsertUser({ name: "Admin", email: "admin@sekolah.test", role: "ADMIN" });
  await upsertUser({
    name: "Kepala Sekolah",
    email: "kepsek@sekolah.test",
    role: "KEPALA_SEKOLAH",
  });
  await upsertUser({
    name: "Petugas TU",
    email: "tu@sekolah.test",
    role: "PETUGAS_TU",
  });
  await upsertUser({ name: "Guru", email: "guru@sekolah.test", role: "GURU" });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


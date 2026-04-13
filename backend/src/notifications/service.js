import { prisma } from "../prisma.js";

export async function notifyRole(role, { title, body }) {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });
  if (!users.length) return 0;
  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, title, body })),
  });
  return users.length;
}

export async function notifyUser(userId, { title, body }) {
  await prisma.notification.create({ data: { userId, title, body } });
}


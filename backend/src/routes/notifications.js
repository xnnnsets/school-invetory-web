import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/middleware.js";
import { validate } from "../http/validate.js";
import { z } from "zod";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const rows = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ data: rows, meta: { unread } });
});

notificationsRouter.post(
  "/:id/read",
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req, res) => {
    const { id } = req.validated.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ ok: true });
  },
);


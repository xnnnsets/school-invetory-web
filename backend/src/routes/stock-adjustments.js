import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { HttpError } from "../http/errors.js";

export const stockAdjustmentsRouter = Router();

stockAdjustmentsRouter.use(requireAuth, requireRole("ADMIN", "PETUGAS_TU"));

stockAdjustmentsRouter.get("/", async (req, res) => {
  const itemId = req.query.itemId ? String(req.query.itemId) : null;
  const take = Math.min(Number(req.query.limit || 30), 100);
  const rows = await prisma.stockAdjustment.findMany({
    where: itemId ? { itemId } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      item: { select: { id: true, code: true, name: true, unit: true } },
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });
  res.json({ data: rows });
});

stockAdjustmentsRouter.post(
  "/",
  validate(
    z.object({
      body: z.object({
        itemId: z.string().min(1),
        delta: z.number().int(),
        reason: z.string().optional(),
      }),
    }),
  ),
  async (req, res, next) => {
    try {
      const { itemId, delta, reason } = req.validated.body;
      if (!delta) throw new HttpError(400, "Delta tidak boleh 0");

      const result = await prisma.$transaction(async (tx) => {
        const item = await tx.item.findUnique({ where: { id: itemId } });
        if (!item) throw new HttpError(404, "Item tidak ditemukan");
        const newStock = item.stock + delta;
        if (newStock < 0) throw new HttpError(400, "Stok tidak boleh negatif");

        await tx.item.update({ where: { id: itemId }, data: { stock: newStock } });
        const adj = await tx.stockAdjustment.create({
          data: {
            itemId,
            delta,
            reason,
            createdById: req.user.id,
          },
          include: {
            item: { select: { id: true, code: true, name: true, unit: true } },
            createdBy: { select: { id: true, name: true, role: true } },
          },
        });
        return adj;
      });

      res.status(201).json({ data: result });
    } catch (e) {
      next(e);
    }
  },
);


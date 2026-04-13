import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { HttpError } from "../http/errors.js";

export const inboundRouter = Router();

inboundRouter.use(requireAuth, requireRole("ADMIN", "PETUGAS_TU"));

inboundRouter.get("/", async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(String(from));
    if (to) where.date.lte = new Date(String(to));
  }
  const rows = await prisma.inbound.findMany({
    where,
    orderBy: { date: "desc" },
    include: { supplier: true, lines: { include: { item: true } } },
  });
  res.json({ data: rows });
});

inboundRouter.post(
  "/",
  validate(
    z.object({
      body: z.object({
        date: z.string().datetime().optional(),
        note: z.string().optional(),
        supplierId: z.string().optional().nullable(),
        lines: z
          .array(
            z.object({
              itemId: z.string().min(1),
              qty: z.number().int().positive(),
            }),
          )
          .min(1),
      }),
    }),
  ),
  async (req, res, next) => {
    try {
      const b = req.validated.body;
      const created = await prisma.$transaction(async (tx) => {
        for (const ln of b.lines) {
          const item = await tx.item.findUnique({ where: { id: ln.itemId } });
          if (!item) throw new HttpError(400, `Item tidak ditemukan: ${ln.itemId}`);
        }

        const inbound = await tx.inbound.create({
          data: {
            date: b.date ? new Date(b.date) : undefined,
            note: b.note,
            supplierId: b.supplierId ?? null,
            lines: { create: b.lines.map((l) => ({ itemId: l.itemId, qty: l.qty })) },
          },
          include: { supplier: true, lines: { include: { item: true } } },
        });

        for (const ln of b.lines) {
          await tx.item.update({
            where: { id: ln.itemId },
            data: { stock: { increment: ln.qty } },
          });
        }

        return inbound;
      });

      res.status(201).json({ data: created });
    } catch (e) {
      next(e);
    }
  },
);


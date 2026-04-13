import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { HttpError } from "../http/errors.js";

export const outboundRouter = Router();

outboundRouter.use(requireAuth, requireRole("ADMIN", "PETUGAS_TU"));

outboundRouter.get("/", async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(String(from));
    if (to) where.date.lte = new Date(String(to));
  }
  const rows = await prisma.outbound.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      lines: { include: { item: true } },
    },
  });
  res.json({ data: rows });
});

outboundRouter.post(
  "/",
  validate(
    z.object({
      body: z.object({
        date: z.string().datetime().optional(),
        recipient: z.string().optional(),
        note: z.string().optional(),
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
          if (item.stock < ln.qty) throw new HttpError(400, `Stok tidak cukup untuk item ${item.name}`);
        }

        const outbound = await tx.outbound.create({
          data: {
            date: b.date ? new Date(b.date) : undefined,
            recipient: b.recipient,
            note: b.note,
            createdById: req.user.id,
            lines: { create: b.lines.map((l) => ({ itemId: l.itemId, qty: l.qty })) },
          },
          include: {
            createdBy: { select: { id: true, name: true, role: true } },
            lines: { include: { item: true } },
          },
        });

        for (const ln of b.lines) {
          await tx.item.update({
            where: { id: ln.itemId },
            data: { stock: { decrement: ln.qty } },
          });
        }

        return outbound;
      });

      res.status(201).json({ data: created });
    } catch (e) {
      next(e);
    }
  },
);


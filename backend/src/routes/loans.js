import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { HttpError } from "../http/errors.js";

export const loansRouter = Router();

loansRouter.use(requireAuth);

// Guru: ajukan peminjaman
loansRouter.post(
  "/",
  requireRole("GURU"),
  validate(
    z.object({
      body: z.object({
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
      const loan = await prisma.loan.create({
        data: {
          requesterId: req.user.id,
          note: b.note,
          lines: { create: b.lines.map((l) => ({ itemId: l.itemId, qty: l.qty })) },
        },
        include: { lines: { include: { item: true } } },
      });
      res.status(201).json({ data: loan });
    } catch (e) {
      next(e);
    }
  },
);

// Guru: riwayat sendiri; TU/Admin/Kepsek: lihat semua
loansRouter.get("/", async (req, res) => {
  const where =
    req.user.role === "GURU"
      ? { requesterId: req.user.id }
      : undefined;

  const rows = await prisma.loan.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      handledBy: { select: { id: true, name: true, email: true, role: true } },
      lines: { include: { item: true } },
    },
  });
  res.json({ data: rows });
});

// TU: approve -> stok berkurang
loansRouter.post(
  "/:id/approve",
  requireRole("PETUGAS_TU", "ADMIN"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req, res, next) => {
    try {
      const { id } = req.validated.params;
      const result = await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
          where: { id },
          include: { lines: true },
        });
        if (!loan) throw new HttpError(404, "Peminjaman tidak ditemukan");
        if (loan.status !== "PENDING") throw new HttpError(400, "Status peminjaman tidak valid");

        for (const ln of loan.lines) {
          const item = await tx.item.findUnique({ where: { id: ln.itemId } });
          if (!item) throw new HttpError(400, "Item tidak ditemukan");
          if (item.stock < ln.qty) throw new HttpError(400, `Stok tidak cukup untuk item ${item.name}`);
        }

        await tx.loan.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            handledById: req.user.id,
          },
        });

        for (const ln of loan.lines) {
          await tx.item.update({
            where: { id: ln.itemId },
            data: { stock: { decrement: ln.qty } },
          });
        }

        return tx.loan.findUnique({
          where: { id },
          include: { lines: { include: { item: true } } },
        });
      });

      res.json({ data: result });
    } catch (e) {
      next(e);
    }
  },
);

// TU: reject
loansRouter.post(
  "/:id/reject",
  requireRole("PETUGAS_TU", "ADMIN"),
  validate(
    z.object({
      params: z.object({ id: z.string().min(1) }),
      body: z.object({ note: z.string().optional() }).optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const { id } = req.validated.params;
      const loan = await prisma.loan.findUnique({ where: { id } });
      if (!loan) throw new HttpError(404, "Peminjaman tidak ditemukan");
      if (loan.status !== "PENDING") throw new HttpError(400, "Status peminjaman tidak valid");

      const updated = await prisma.loan.update({
        where: { id },
        data: { status: "REJECTED", handledById: req.user.id, note: req.validated.body?.note ?? loan.note },
        include: { lines: { include: { item: true } } },
      });
      res.json({ data: updated });
    } catch (e) {
      next(e);
    }
  },
);

// TU: mark returned -> stok bertambah
loansRouter.post(
  "/:id/return",
  requireRole("PETUGAS_TU", "ADMIN"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req, res, next) => {
    try {
      const { id } = req.validated.params;
      const result = await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
          where: { id },
          include: { lines: true },
        });
        if (!loan) throw new HttpError(404, "Peminjaman tidak ditemukan");
        if (loan.status !== "APPROVED") throw new HttpError(400, "Status peminjaman tidak valid");

        await tx.loan.update({
          where: { id },
          data: { status: "RETURNED", returnedAt: new Date(), handledById: req.user.id },
        });

        for (const ln of loan.lines) {
          await tx.item.update({
            where: { id: ln.itemId },
            data: { stock: { increment: ln.qty } },
          });
        }

        return tx.loan.findUnique({
          where: { id },
          include: { lines: { include: { item: true } } },
        });
      });

      res.json({ data: result });
    } catch (e) {
      next(e);
    }
  },
);


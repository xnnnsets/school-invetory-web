import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { HttpError } from "../http/errors.js";
import { notifyRole, notifyUser } from "../notifications/service.js";

export const requestsRouter = Router();

requestsRouter.use(requireAuth);

// Guru: ajukan permintaan barang
requestsRouter.post(
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
      const created = await prisma.request.create({
        data: {
          requesterId: req.user.id,
          note: b.note,
          lines: { create: b.lines.map((l) => ({ itemId: l.itemId, qty: l.qty })) },
        },
        include: { lines: { include: { item: true } } },
      });

      await notifyRole("PETUGAS_TU", {
        title: "Permintaan baru",
        body: `${req.user.name} mengajukan permintaan barang.`,
      });
      await notifyRole("KEPALA_SEKOLAH", {
        title: "Permintaan baru",
        body: `${req.user.name} mengajukan permintaan barang.`,
      });

      res.status(201).json({ data: created });
    } catch (e) {
      next(e);
    }
  },
);

// Guru: lihat milik sendiri; lainnya: lihat semua
requestsRouter.get("/", async (req, res) => {
  const mine = String(req.query.mine || "") === "1";
  const where =
    req.user.role === "GURU" || mine ? { requesterId: req.user.id } : undefined;

  const rows = await prisma.request.findMany({
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

requestsRouter.post(
  "/:id/approve",
  requireRole("PETUGAS_TU", "ADMIN"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req, res, next) => {
    try {
      const { id } = req.validated.params;
      const r = await prisma.request.findUnique({ where: { id } });
      if (!r) throw new HttpError(404, "Permintaan tidak ditemukan");
      if (r.status !== "PENDING") throw new HttpError(400, "Status permintaan tidak valid");

      const updated = await prisma.request.update({
        where: { id },
        data: { status: "APPROVED", approvedAt: new Date(), handledById: req.user.id },
        include: { lines: { include: { item: true } } },
      });
      await notifyUser(updated.requesterId, { title: "Permintaan disetujui", body: "Permintaan kamu disetujui TU." });
      res.json({ data: updated });
    } catch (e) {
      next(e);
    }
  },
);

requestsRouter.post(
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
      const r = await prisma.request.findUnique({ where: { id } });
      if (!r) throw new HttpError(404, "Permintaan tidak ditemukan");
      if (r.status !== "PENDING") throw new HttpError(400, "Status permintaan tidak valid");

      const updated = await prisma.request.update({
        where: { id },
        data: { status: "REJECTED", handledById: req.user.id, note: req.validated.body?.note ?? r.note },
        include: { lines: { include: { item: true } } },
      });
      await notifyUser(updated.requesterId, { title: "Permintaan ditolak", body: "Permintaan kamu ditolak TU." });
      res.json({ data: updated });
    } catch (e) {
      next(e);
    }
  },
);

// fulfill -> stok berkurang (seperti barang keluar)
requestsRouter.post(
  "/:id/fulfill",
  requireRole("PETUGAS_TU", "ADMIN"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req, res, next) => {
    try {
      const { id } = req.validated.params;
      const result = await prisma.$transaction(async (tx) => {
        const r = await tx.request.findUnique({
          where: { id },
          include: { lines: true },
        });
        if (!r) throw new HttpError(404, "Permintaan tidak ditemukan");
        if (r.status !== "APPROVED") throw new HttpError(400, "Status permintaan tidak valid");

        for (const ln of r.lines) {
          const item = await tx.item.findUnique({ where: { id: ln.itemId } });
          if (!item) throw new HttpError(400, "Item tidak ditemukan");
          if (item.stock < ln.qty) throw new HttpError(400, `Stok tidak cukup untuk item ${item.name}`);
        }

        await tx.request.update({
          where: { id },
          data: { status: "FULFILLED", fulfilledAt: new Date(), handledById: req.user.id },
        });

        for (const ln of r.lines) {
          await tx.item.update({ where: { id: ln.itemId }, data: { stock: { decrement: ln.qty } } });
        }

        return tx.request.findUnique({
          where: { id },
          include: { lines: { include: { item: true } } },
        });
      });

      await notifyUser(result.requesterId, { title: "Permintaan dipenuhi", body: "Permintaan kamu sudah dipenuhi." });
      res.json({ data: result });
    } catch (e) {
      next(e);
    }
  },
);


import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const itemsRouter = Router();

itemsRouter.use(requireAuth);

itemsRouter.get("/", async (req, res) => {
  const rows = await prisma.item.findMany({
    orderBy: [{ name: "asc" }],
    include: { category: true, room: true },
  });
  res.json({ data: rows });
});

itemsRouter.post(
  "/",
  requireRole("ADMIN", "PETUGAS_TU"),
  validate(
    z.object({
      body: z.object({
        code: z.string().min(2),
        name: z.string().min(2),
        unit: z.string().min(1).optional(),
        minStock: z.number().int().min(0).optional(),
        description: z.string().optional(),
        categoryId: z.string().min(1),
        roomId: z.string().optional().nullable(),
      }),
    }),
  ),
  async (req, res) => {
    const b = req.validated.body;
    const row = await prisma.item.create({
      data: {
        code: b.code,
        name: b.name,
        unit: b.unit ?? "unit",
        minStock: b.minStock ?? 0,
        description: b.description,
        categoryId: b.categoryId,
        roomId: b.roomId ?? null,
      },
      include: { category: true, room: true },
    });
    res.status(201).json({ data: row });
  },
);


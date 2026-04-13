import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", async (req, res) => {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  res.json({ data: rows });
});

categoriesRouter.post(
  "/",
  requireRole("ADMIN", "PETUGAS_TU"),
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2),
        description: z.string().optional(),
      }),
    }),
  ),
  async (req, res) => {
    const row = await prisma.category.create({ data: req.validated.body });
    res.status(201).json({ data: row });
  },
);

categoriesRouter.put(
  "/:id",
  requireRole("ADMIN", "PETUGAS_TU"),
  validate(
    z.object({
      params: z.object({ id: z.string().min(1) }),
      body: z.object({
        name: z.string().min(2),
        description: z.string().optional().nullable(),
      }),
    }),
  ),
  async (req, res) => {
    const row = await prisma.category.update({
      where: { id: req.validated.params.id },
      data: req.validated.body,
    });
    res.json({ data: row });
  },
);

categoriesRouter.delete(
  "/:id",
  requireRole("ADMIN", "PETUGAS_TU"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req, res) => {
    await prisma.category.delete({ where: { id: req.validated.params.id } });
    res.json({ ok: true });
  },
);


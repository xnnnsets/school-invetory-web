import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const suppliersRouter = Router();

suppliersRouter.use(requireAuth);

suppliersRouter.get("/", async (req, res) => {
  const rows = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  res.json({ data: rows });
});

suppliersRouter.post(
  "/",
  requireRole("ADMIN", "PETUGAS_TU"),
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
      }),
    }),
  ),
  async (req, res) => {
    const row = await prisma.supplier.create({ data: req.validated.body });
    res.status(201).json({ data: row });
  },
);

suppliersRouter.put(
  "/:id",
  requireRole("ADMIN", "PETUGAS_TU"),
  validate(
    z.object({
      params: z.object({ id: z.string().min(1) }),
      body: z.object({
        name: z.string().min(2),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        address: z.string().optional().nullable(),
      }),
    }),
  ),
  async (req, res) => {
    const row = await prisma.supplier.update({
      where: { id: req.validated.params.id },
      data: req.validated.body,
    });
    res.json({ data: row });
  },
);

suppliersRouter.delete(
  "/:id",
  requireRole("ADMIN", "PETUGAS_TU"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req, res) => {
    await prisma.supplier.delete({ where: { id: req.validated.params.id } });
    res.json({ ok: true });
  },
);


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
        address: z.string().optional(),
      }),
    }),
  ),
  async (req, res) => {
    const row = await prisma.supplier.create({ data: req.validated.body });
    res.status(201).json({ data: row });
  },
);


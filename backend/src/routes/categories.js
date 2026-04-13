import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", async (req, res) => {
  const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json({ data: rows });
});

categoriesRouter.post(
  "/",
  requireRole("ADMIN", "PETUGAS_TU"),
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2),
      }),
    }),
  ),
  async (req, res) => {
    const row = await prisma.category.create({ data: { name: req.validated.body.name } });
    res.status(201).json({ data: row });
  },
);


import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const schoolRouter = Router();

schoolRouter.use(requireAuth);

schoolRouter.get("/", async (req, res) => {
  const school = await prisma.school.findFirst({ orderBy: { createdAt: "asc" } });
  res.json({ data: school });
});

schoolRouter.put(
  "/",
  requireRole("ADMIN"),
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2),
        npsn: z.string().optional().nullable(),
        level: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        headmasterName: z.string().optional().nullable(),
      }),
    }),
  ),
  async (req, res) => {
    const existing = await prisma.school.findFirst({ orderBy: { createdAt: "asc" } });
    const data = req.validated.body;
    const saved = existing
      ? await prisma.school.update({ where: { id: existing.id }, data })
      : await prisma.school.create({ data });
    res.json({ data: saved });
  },
);


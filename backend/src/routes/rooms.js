import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const roomsRouter = Router();

roomsRouter.use(requireAuth);

roomsRouter.get("/", async (req, res) => {
  const rows = await prisma.room.findMany({ orderBy: { name: "asc" } });
  res.json({ data: rows });
});

roomsRouter.post(
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
    const row = await prisma.room.create({ data: { name: req.validated.body.name } });
    res.status(201).json({ data: row });
  },
);


import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { hashPassword } from "../auth/password.js";
import { HttpError } from "../http/errors.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole("ADMIN"));

usersRouter.get("/", async (req, res) => {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, photoUrl: true, createdAt: true },
  });
  res.json({ data: rows });
});

usersRouter.post(
  "/",
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        role: z.enum(["ADMIN", "KEPALA_SEKOLAH", "PETUGAS_TU", "GURU"]),
        password: z.string().min(6).optional(),
      }),
    }),
  ),
  async (req, res, next) => {
    try {
      const b = req.validated.body;
      const passwordHash = await hashPassword(b.password || "Password123!");
      const row = await prisma.user.create({
        data: { name: b.name, email: b.email, role: b.role, passwordHash },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      });
      res.status(201).json({ data: row });
    } catch (e) {
      next(e);
    }
  },
);

usersRouter.put(
  "/:id",
  validate(
    z.object({
      params: z.object({ id: z.string().min(1) }),
      body: z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        role: z.enum(["ADMIN", "KEPALA_SEKOLAH", "PETUGAS_TU", "GURU"]).optional(),
        photoUrl: z.string().url().optional().nullable(),
      }),
    }),
  ),
  async (req, res, next) => {
    try {
      const { id } = req.validated.params;
      const b = req.validated.body;
      const row = await prisma.user.update({
        where: { id },
        data: {
          ...(b.name !== undefined ? { name: b.name } : null),
          ...(b.email !== undefined ? { email: b.email } : null),
          ...(b.role !== undefined ? { role: b.role } : null),
          ...(b.photoUrl !== undefined ? { photoUrl: b.photoUrl } : null),
        },
        select: { id: true, name: true, email: true, role: true, isActive: true, photoUrl: true },
      });
      res.json({ data: row });
    } catch (e) {
      next(e);
    }
  },
);

usersRouter.put(
  "/:id/password",
  validate(
    z.object({
      params: z.object({ id: z.string().min(1) }),
      body: z.object({ password: z.string().min(6) }),
    }),
  ),
  async (req, res, next) => {
    try {
      const { id } = req.validated.params;
      const { password } = req.validated.body;
      const passwordHash = await hashPassword(password);
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

usersRouter.put(
  "/:id/status",
  validate(
    z.object({
      params: z.object({ id: z.string().min(1) }),
      body: z.object({ isActive: z.boolean() }),
    }),
  ),
  async (req, res, next) => {
    try {
      const { id } = req.validated.params;
      if (req.user.id === id) throw new HttpError(400, "Tidak bisa menonaktifkan akun sendiri");
      const row = await prisma.user.update({
        where: { id },
        data: { isActive: req.validated.body.isActive },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      res.json({ data: row });
    } catch (e) {
      next(e);
    }
  },
);


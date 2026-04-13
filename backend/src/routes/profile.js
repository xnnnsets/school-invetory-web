import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/middleware.js";
import { validate } from "../http/validate.js";
import { verifyPassword, hashPassword } from "../auth/password.js";
import { HttpError } from "../http/errors.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", async (req, res) => {
  res.json({ data: req.user });
});

profileRouter.put(
  "/",
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        photoUrl: z.string().url().optional().nullable(),
      }),
    }),
  ),
  async (req, res, next) => {
    try {
      const b = req.validated.body;
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(b.name !== undefined ? { name: b.name } : null),
          ...(b.email !== undefined ? { email: b.email } : null),
          ...(b.photoUrl !== undefined ? { photoUrl: b.photoUrl } : null),
        },
        select: { id: true, name: true, email: true, role: true, isActive: true, photoUrl: true, lastLoginAt: true },
      });
      res.json({ data: updated });
    } catch (e) {
      next(e);
    }
  },
);

profileRouter.put(
  "/password",
  validate(
    z.object({
      body: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      }),
    }),
  ),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.validated.body;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) throw new HttpError(404, "User tidak ditemukan");
      const ok = await verifyPassword(currentPassword, user.passwordHash);
      if (!ok) throw new HttpError(400, "Password lama salah");
      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);


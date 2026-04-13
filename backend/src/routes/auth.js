import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { validate } from "../http/validate.js";
import { HttpError } from "../http/errors.js";
import { verifyPassword } from "../auth/password.js";
import { signAccessToken } from "../auth/jwt.js";
import { requireAuth } from "../auth/middleware.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    }),
  ),
  async (req, res, next) => {
    try {
      const { email, password } = req.validated.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) throw new HttpError(401, "Email/password salah");
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) throw new HttpError(401, "Email/password salah");

      const token = signAccessToken({ sub: user.id, role: user.role });
      res.json({
        accessToken: token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, photoUrl: user.photoUrl },
      });
    } catch (e) {
      next(e);
    }
  },
);

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});


import { HttpError } from "../http/errors.js";
import { verifyAccessToken } from "./jwt.js";
import { prisma } from "../prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");
    if (!token) throw new HttpError(401, "Unauthorized");

    const payload = verifyAccessToken(token);
    if (!payload?.sub) throw new HttpError(401, "Unauthorized");

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, isActive: true, photoUrl: true },
    });

    if (!user || !user.isActive) throw new HttpError(401, "Unauthorized");
    req.user = user;
    next();
  } catch (e) {
    next(new HttpError(401, "Unauthorized"));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return next(new HttpError(401, "Unauthorized"));
    if (!roles.includes(role)) return next(new HttpError(403, "Forbidden"));
    next();
  };
}


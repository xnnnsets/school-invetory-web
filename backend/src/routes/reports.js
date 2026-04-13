import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/middleware.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

function parseRange(q) {
  const from = q.from ? new Date(String(q.from)) : null;
  const to = q.to ? new Date(String(q.to)) : null;
  const where = {};
  if (from || to) {
    where.gte = from || undefined;
    where.lte = to || undefined;
  }
  return { from, to, where: Object.keys(where).length ? where : null };
}

reportsRouter.get("/stock", async (req, res) => {
  const rows = await prisma.item.findMany({
    orderBy: { name: "asc" },
    include: { category: true, room: true },
  });
  res.json({ data: rows });
});

reportsRouter.get("/inbound", async (req, res) => {
  const { where } = parseRange(req.query);
  const rows = await prisma.inbound.findMany({
    where: where ? { date: where } : undefined,
    orderBy: { date: "desc" },
    include: { supplier: true, lines: { include: { item: true } } },
  });
  res.json({ data: rows });
});

reportsRouter.get("/outbound", async (req, res) => {
  const { where } = parseRange(req.query);
  const rows = await prisma.outbound.findMany({
    where: where ? { date: where } : undefined,
    orderBy: { date: "desc" },
    include: { lines: { include: { item: true } } },
  });
  res.json({ data: rows });
});

reportsRouter.get("/loans", async (req, res) => {
  const { where } = parseRange(req.query);
  const status = req.query.status ? String(req.query.status) : null;
  const baseWhere = {
    ...(where ? { requestedAt: where } : null),
    ...(status ? { status } : null),
    ...(req.user.role === "GURU" ? { requesterId: req.user.id } : null),
  };

  const rows = await prisma.loan.findMany({
    where: baseWhere,
    orderBy: { requestedAt: "desc" },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      handledBy: { select: { id: true, name: true, email: true, role: true } },
      lines: { include: { item: true } },
    },
  });
  res.json({ data: rows });
});

reportsRouter.get("/requests", async (req, res) => {
  const { where } = parseRange(req.query);
  const status = req.query.status ? String(req.query.status) : null;
  const baseWhere = {
    ...(where ? { requestedAt: where } : null),
    ...(status ? { status } : null),
    ...(req.user.role === "GURU" ? { requesterId: req.user.id } : null),
  };

  const rows = await prisma.request.findMany({
    where: baseWhere,
    orderBy: { requestedAt: "desc" },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      handledBy: { select: { id: true, name: true, email: true, role: true } },
      lines: { include: { item: true } },
    },
  });
  res.json({ data: rows });
});


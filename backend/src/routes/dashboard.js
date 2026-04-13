import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/middleware.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

function monthKey(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function startOfMonth(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(dt) {
  return new Date(dt.getFullYear(), dt.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfDay(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
}

function endOfDay(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999);
}

dashboardRouter.get("/summary", async (req, res) => {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const dayFrom = startOfDay(now);
  const dayTo = endOfDay(now);

  const [totalItems, itemsStock, inboundLines, outboundLines, pendingLoans, pendingRequests, inboundToday, outboundToday] =
    await Promise.all([
    prisma.item.count(),
    prisma.item.findMany({ select: { stock: true, minStock: true } }),
    prisma.inboundLine.aggregate({
      where: { inbound: { date: { gte: from, lte: to } } },
      _sum: { qty: true },
    }),
    prisma.outboundLine.aggregate({
      where: { outbound: { date: { gte: from, lte: to } } },
      _sum: { qty: true },
    }),
    prisma.loan.count({ where: { status: "PENDING" } }),
    prisma.request.count({ where: { status: "PENDING" } }),
    prisma.inbound.count({ where: { date: { gte: dayFrom, lte: dayTo } } }),
    prisma.outbound.count({ where: { date: { gte: dayFrom, lte: dayTo } } }),
  ]);

  const lowStockItems = itemsStock.filter((x) => (x.minStock || 0) > 0 && x.stock <= x.minStock).length;

  res.json({
    data: {
      totalItems,
      inboundThisMonthQty: inboundLines._sum.qty || 0,
      outboundThisMonthQty: outboundLines._sum.qty || 0,
      lowStockItems,
      pendingLoans,
      pendingRequests,
      inboundToday,
      outboundToday,
    },
  });
});

dashboardRouter.get("/trends", async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 31 * 5);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();

  const [inbounds, outbounds] = await Promise.all([
    prisma.inbound.findMany({
      where: { date: { gte: from, lte: to } },
      select: { date: true, lines: { select: { qty: true } } },
    }),
    prisma.outbound.findMany({
      where: { date: { gte: from, lte: to } },
      select: { date: true, lines: { select: { qty: true } } },
    }),
  ]);

  const map = new Map();
  for (const ib of inbounds) {
    const k = monthKey(ib.date);
    const prev = map.get(k) || { inboundQty: 0, outboundQty: 0 };
    const sum = ib.lines.reduce((a, x) => a + x.qty, 0);
    prev.inboundQty += sum;
    map.set(k, prev);
  }
  for (const ob of outbounds) {
    const k = monthKey(ob.date);
    const prev = map.get(k) || { inboundQty: 0, outboundQty: 0 };
    const sum = ob.lines.reduce((a, x) => a + x.qty, 0);
    prev.outboundQty += sum;
    map.set(k, prev);
  }

  const keys = [...map.keys()].sort();
  res.json({
    data: keys.map((k) => ({ bucket: k, ...map.get(k) })),
  });
});

dashboardRouter.get("/stock-by-category", async (req, res) => {
  const rows = await prisma.item.findMany({
    select: { stock: true, category: { select: { id: true, name: true } } },
  });

  const map = new Map();
  for (const r of rows) {
    const key = r.category.id;
    const prev = map.get(key) || { categoryId: key, categoryName: r.category.name, stock: 0 };
    prev.stock += r.stock;
    map.set(key, prev);
  }

  res.json({ data: [...map.values()].sort((a, b) => b.stock - a.stock) });
});

dashboardRouter.get("/recent-activity", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 8), 30);

  const [inbounds, outbounds, loans, requests] = await Promise.all([
    prisma.inbound.findMany({
      take: limit,
      orderBy: { date: "desc" },
      include: { lines: { include: { item: true } } },
    }),
    prisma.outbound.findMany({
      take: limit,
      orderBy: { date: "desc" },
      include: { lines: { include: { item: true } } },
    }),
    prisma.loan.findMany({
      take: limit,
      orderBy: { requestedAt: "desc" },
      include: { lines: { include: { item: true } }, requester: { select: { name: true } } },
    }),
    prisma.request.findMany({
      take: limit,
      orderBy: { requestedAt: "desc" },
      include: { lines: { include: { item: true } }, requester: { select: { name: true } } },
    }),
  ]);

  const activities = [
    ...inbounds.map((x) => ({
      type: "INBOUND",
      at: x.date,
      note: x.note,
      items: x.lines.map((l) => ({ name: l.item.name, qty: l.qty })),
    })),
    ...outbounds.map((x) => ({
      type: "OUTBOUND",
      at: x.date,
      note: x.note,
      items: x.lines.map((l) => ({ name: l.item.name, qty: l.qty })),
    })),
    ...loans.map((x) => ({
      type: "LOAN",
      at: x.requestedAt,
      note: x.note,
      meta: { requesterName: x.requester?.name, status: x.status },
      items: x.lines.map((l) => ({ name: l.item.name, qty: l.qty })),
    })),
    ...requests.map((x) => ({
      type: "REQUEST",
      at: x.requestedAt,
      note: x.note,
      meta: { requesterName: x.requester?.name, status: x.status },
      items: x.lines.map((l) => ({ name: l.item.name, qty: l.qty })),
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);

  res.json({ data: activities });
});


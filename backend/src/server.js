import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env, requireEnv } from "./env.js";
import { errorHandler, notFound } from "./http/errors.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { roomsRouter } from "./routes/rooms.js";
import { itemsRouter } from "./routes/items.js";
import { inboundRouter } from "./routes/inbound.js";
import { outboundRouter } from "./routes/outbound.js";
import { loansRouter } from "./routes/loans.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { usersRouter } from "./routes/users.js";
import { schoolRouter } from "./routes/school.js";

requireEnv();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "inventaris-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/inbound", inboundRouter);
app.use("/api/outbound", outboundRouter);
app.use("/api/loans", loansRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/school", schoolRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${env.PORT}`);
});


import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env, requireEnv } from "./env.js";
import { errorHandler, notFound } from "./http/errors.js";
import { authRouter } from "./routes/auth.js";

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

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${env.PORT}`);
});


export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  const status = err?.status || 500;
  const code = err?.code || "INTERNAL_ERROR";
  const message = err?.message || "Internal Server Error";
  const details = err?.details;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: code, message, details });
}


import { HttpError } from "./errors.js";

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.validated = parsed;
      next();
    } catch (e) {
      next(new HttpError(400, "Validation error", e?.issues || e));
    }
  };
}


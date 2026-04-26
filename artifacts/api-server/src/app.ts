import express, { type Express } from "express";
import cors from "cors";
import { supabaseAuthMiddleware } from "./middlewares/supabaseAuthMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    logger.info(
      {
        method: req.method,
        url: req.originalUrl?.split("?")[0],
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      "http_request",
    );
  });
  next();
});

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Supabase auth middleware (replaces Clerk)
app.use(supabaseAuthMiddleware);

app.use("/api", router);

app.use((err: any, _req: any, res: any, next: any) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Upload payload too large. Please use smaller images." });
  }
  next(err);
});

export default app;
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { supabaseAuthMiddleware } from "./middlewares/supabaseAuthMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

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
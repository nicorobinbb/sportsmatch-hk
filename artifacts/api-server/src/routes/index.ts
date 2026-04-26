import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import publicRouter from "./public.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);

export default router;

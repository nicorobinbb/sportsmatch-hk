import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coachesRouter from "./coaches";
import reviewsRouter from "./reviews";
import photosRouter from "./photos";
import categoriesRouter from "./categories";
import featuredRouter from "./featured";
import userPreferencesRouter from "./userPreferences";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/coaches", coachesRouter);
router.use("/reviews", reviewsRouter);
router.use("/photos", photosRouter);
router.use("/categories", categoriesRouter);
router.use("/featured", featuredRouter);
router.use("/user", userPreferencesRouter);
router.use("/admin", adminRouter);

export default router;

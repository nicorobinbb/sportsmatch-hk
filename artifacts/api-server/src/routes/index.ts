import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import coachesRouter from "./coaches.js";
import reviewsRouter from "./reviews.js";
import photosRouter from "./photos.js";
import categoriesRouter from "./categories.js";
import featuredRouter from "./featured.js";
import userPreferencesRouter from "./userPreferences.js";
import adminRouter from "./admin.js";
import wishlistsRouter from "./wishlists.js";
import reportsRouter from "./reports.js";
import userProfileRouter from "./userProfile.js";
import coachPostsRouter from "./coachPosts.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/coaches", coachesRouter);
router.use("/reviews", reviewsRouter);
router.use("/photos", photosRouter);
router.use("/categories", categoriesRouter);
router.use("/featured", featuredRouter);
router.use("/user", userPreferencesRouter);
router.use("/user/profile", userProfileRouter);
router.use("/wishlist", wishlistsRouter);
router.use("/reports", reportsRouter);
router.use("/admin", adminRouter);
router.use("/posts", coachPostsRouter);

export default router;

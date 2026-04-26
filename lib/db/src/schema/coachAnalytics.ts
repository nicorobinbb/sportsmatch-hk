import { pgTable, serial, integer, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Daily analytics for coaches
export const coachAnalyticsTable = pgTable("coach_analytics", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  
  // Profile views
  profileViews: integer("profile_views").notNull().default(0),
  
  // Contact unlocks (paid)
  contactUnlocks: integer("contact_unlocks").notNull().default(0),
  unlockRevenue: integer("unlock_revenue").notNull().default(0), // in HKD cents (e.g. 3000 = $30.00)
  
  // Wishlist saves
  wishlistAdds: integer("wishlist_adds").notNull().default(0),
  wishlistRemoves: integer("wishlist_removes").notNull().default(0),
  
  // Additional metrics
  phoneClicks: integer("phone_clicks").notNull().default(0),
  whatsappClicks: integer("whatsapp_clicks").notNull().default(0),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Aggregate stats (rolled up per coach)
export const coachStatsTable = pgTable("coach_stats", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull().unique(),
  
  // Total counts
  totalProfileViews: integer("total_profile_views").notNull().default(0),
  totalContactUnlocks: integer("total_contact_unlocks").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // in HKD cents
  totalWishlistSaves: integer("total_wishlist_saves").notNull().default(0),
  
  // Unlock price setting (how much to charge to unlock contact)
  unlockPrice: integer("unlock_price").notNull().default(3000), // default $30.00 in cents
  unlockPriceEnabled: integer("unlock_price_enabled").notNull().default(1), // 0 or 1
  
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCoachAnalyticsSchema = createInsertSchema(coachAnalyticsTable).omit({
  id: true,
  createdAt: true,
});

export const insertCoachStatsSchema = createInsertSchema(coachStatsTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertCoachAnalytics = z.infer<typeof insertCoachAnalyticsSchema>;
export type CoachAnalytics = typeof coachAnalyticsTable.$inferSelect;
export type InsertCoachStats = z.infer<typeof insertCoachStatsSchema>;
export type CoachStats = typeof coachStatsTable.$inferSelect;

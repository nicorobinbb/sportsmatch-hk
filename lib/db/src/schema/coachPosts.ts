import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coachPostsTable = pgTable("coach_posts", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  caption: text("caption"),
  mediaUrls: text("media_urls"),
  youtubeUrl: text("youtube_url"),
  isApproved: boolean("is_approved").notNull().default(false),
  isRejected: boolean("is_rejected").notNull().default(false),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCoachPostSchema = createInsertSchema(coachPostsTable).omit({
  id: true,
  isApproved: true,
  isRejected: true,
  rejectionReason: true,
  createdAt: true,
});

export type InsertCoachPost = z.infer<typeof insertCoachPostSchema>;
export type CoachPost = typeof coachPostsTable.$inferSelect;

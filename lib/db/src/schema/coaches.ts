import { pgTable, text, serial, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coachesTable = pgTable("coaches", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  sportsCategory: text("sports_category").notNull(),
  location: text("location").notNull(),
  bio: text("bio").notNull(),
  trialPrice: numeric("trial_price", { precision: 10, scale: 2 }).notNull(),
  regularPrice: numeric("regular_price", { precision: 10, scale: 2 }).notNull(),
  packageDetails: text("package_details"),
  ageGroups: text("age_groups").array().notNull().default([]),
  experienceLevel: text("experience_level").notNull(),
  isFeatured: boolean("is_featured").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(false),
  isRejected: boolean("is_rejected").notNull().default(false),
  profileImageUrl: text("profile_image_url"),
  whatsappNumber: text("whatsapp_number"),
  youtubeUrl: text("youtube_url"),
  youtubePending: text("youtube_pending"),
  qualifications: text("qualifications"),
  qualificationProofUrl: text("qualification_proof_url"),
  pendingEdits: text("pending_edits"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCoachSchema = createInsertSchema(coachesTable).omit({
  id: true,
  isFeatured: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type Coach = typeof coachesTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userCategoryClicksTable = pgTable("user_category_clicks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(),
  clickCount: integer("click_count").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserCategoryClickSchema = createInsertSchema(userCategoryClicksTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserCategoryClick = z.infer<typeof insertUserCategoryClickSchema>;
export type UserCategoryClick = typeof userCategoryClicksTable.$inferSelect;

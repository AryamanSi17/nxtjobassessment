import { pgTable, varchar, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const leads = pgTable("leads", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(), // Corrected
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  owner: varchar("owner", { length: 50 }).notNull(),
  stage: varchar("stage", { length: 50 }).default("New Lead").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

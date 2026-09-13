import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    client: text("client").notNull(),
    url: text("url").notNull(),
    payload: text("payload").notNull(),
    revision: integer("revision").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("idx_reports_owner_created").on(t.ownerId, t.createdAt)],
);
export const auditJobs = sqliteTable(
  "audit_jobs",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("idx_audit_jobs_owner_created").on(t.ownerId, t.createdAt)],
);

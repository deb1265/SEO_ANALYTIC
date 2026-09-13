import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
export function openDatabase(filename = ":memory:") {
  const sql = new DatabaseSync(filename);
  sql.exec(
    "CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY)",
  );
  for (const f of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (
      !sql.prepare("SELECT name FROM _local_migrations WHERE name=?").get(f)
    ) {
      sql.exec("BEGIN");
      try {
        sql.exec(readFileSync("drizzle/" + f, "utf8"));
        sql.prepare("INSERT INTO _local_migrations VALUES (?)").run(f);
        sql.exec("COMMIT");
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    }
  }
  return {
    close: () => sql.close(),
    prepare(query) {
      let args = [];
      return {
        bind(...v) {
          args = v;
          return this;
        },
        async first() {
          return sql.prepare(query).get(...args) || null;
        },
        async all() {
          return { results: sql.prepare(query).all(...args) };
        },
        async run() {
          return { meta: sql.prepare(query).run(...args) };
        },
      };
    },
  };
}

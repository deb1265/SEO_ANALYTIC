export function db(env: any) {
  if (!env.DB)
    throw new Error(
      "Saved reports are temporarily unavailable. Try again shortly.",
    );
  return env.DB;
}
export async function listReports(env: any, owner: string) {
  const r = await db(env)
    .prepare(
      "SELECT payload,revision FROM reports WHERE owner_id=? ORDER BY created_at DESC LIMIT 100",
    )
    .bind(owner)
    .all();
  return r.results.map((r: any) => ({
    ...JSON.parse(r.payload),
    revision: r.revision,
  }));
}
export async function saveNew(
  env: any,
  owner: string,
  report: any,
  ignore = false,
) {
  await db(env)
    .prepare(
      `${ignore ? "INSERT OR IGNORE" : "INSERT"} INTO reports (id,owner_id,client,url,payload,revision,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`,
    )
    .bind(
      report.id,
      owner,
      report.client,
      report.url,
      JSON.stringify(report),
      1,
      report.createdAt,
      report.updatedAt,
    )
    .run();
}

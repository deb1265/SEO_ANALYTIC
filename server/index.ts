import assets from "../.sites-runtime/assets.json";
import { handleApi } from "./api";
export default {
  async fetch(req: Request, env: any) {
    const u = new URL(req.url);
    if (u.pathname.startsWith("/api/")) return handleApi(req, env);
    const key = u.pathname === "/" ? "/index.html" : u.pathname;
    const entry = (assets as Record<string, string[]>)[key];
    if (!entry) return new Response("Not found", { status: 404 });
    const bytes = Uint8Array.from(atob(entry[1]), (c) => c.charCodeAt(0));
    return new Response(bytes, {
      headers: {
        "content-type": entry[0],
        "cache-control": key.includes("/assets/")
          ? "public,max-age=31536000,immutable"
          : "no-cache",
        "x-content-type-options": "nosniff",
      },
    });
  },
};

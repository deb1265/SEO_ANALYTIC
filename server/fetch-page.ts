import { safeUrl } from "../src/pro/public-url.js";
export { safeUrl } from "../src/pro/public-url.js";
function publicAddress(ip: string) {
  if (ip.includes(":"))
    return /^(2|3)[0-9a-f]{3}:/i.test(ip) && !/^2001:(db8|0:)/i.test(ip);
  const n = ip.split(".").map(Number);
  if (n.length !== 4 || n.some((x) => !Number.isInteger(x) || x < 0 || x > 255))
    return false;
  return !(
    n[0] === 0 ||
    n[0] === 10 ||
    n[0] === 127 ||
    n[0] >= 224 ||
    (n[0] === 100 && n[1] >= 64 && n[1] <= 127) ||
    (n[0] === 169 && n[1] === 254) ||
    (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
    (n[0] === 192 && (n[1] === 168 || n[1] === 0)) ||
    (n[0] === 198 &&
      (n[1] === 18 || n[1] === 19 || (n[1] === 51 && n[2] === 100))) ||
    (n[0] === 203 && n[1] === 0 && n[2] === 113)
  );
}
async function verifyDns(host: string) {
  const results = await Promise.all(
    ["A", "AAAA"].map(async (type) => {
      const r = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
        {
          headers: { Accept: "application/dns-json" },
          signal: AbortSignal.timeout(6000),
        },
      );
      if (!r.ok) throw new Error("Could not verify public hostname.");
      const d: any = await r.json();
      if (d.Status !== 0) throw new Error("Hostname does not resolve.");
      return (d.Answer || [])
        .filter((x: any) => x.type === 1 || x.type === 28)
        .map((x: any) => x.data as string);
    }),
  );
  const ips = results.flat();
  if (!ips.length || ips.some((ip) => !publicAddress(ip)))
    throw new Error("Only public website addresses are allowed.");
}
export async function fetchPublic(input: string, maxBytes = 2_000_000) {
  let url = safeUrl(input);
  const start = Date.now();
  for (let i = 0; i < 4; i++) {
    await verifyDns(new URL(url).hostname);
    const r = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": "SEOAnalytic/2.0 (+public-page audit)",
        Accept: "text/html,application/xml,text/plain;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    if ([301, 302, 303, 307, 308].includes(r.status)) {
      const location = r.headers.get("location");
      if (!location) throw new Error("Redirect without a destination.");
      url = safeUrl(new URL(location, url).href);
      continue;
    }
    const reader = r.body?.getReader();
    let text = "",
      size = 0;
    const decoder = new TextDecoder();
    if (reader) {
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.length;
          if (size > maxBytes)
            throw new Error("Page exceeds the audit size limit.");
          text += decoder.decode(chunk.value, { stream: true });
        }
        text += decoder.decode();
      } finally {
        await reader.cancel();
      }
    }
    return {
      url,
      status: r.status,
      text,
      headers: Object.fromEntries(r.headers),
      fetchMs: Date.now() - start,
    };
  }
  throw new Error("Too many redirects.");
}

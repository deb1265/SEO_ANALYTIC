import { normalizeUrl } from "../utils/url.js";
const LOCAL_SUFFIXES = [
  ".local",
  ".internal",
  ".localhost",
  ".home",
  ".lan",
  ".test",
  ".invalid",
  ".onion",
];
export function safeUrl(value: string) {
  const url = new URL(normalizeUrl(value));
  if (
    (url.port && !["80", "443"].includes(url.port)) ||
    LOCAL_SUFFIXES.some((s) => url.hostname.endsWith(s))
  )
    throw new Error(
      "Only public HTTP(S) websites on standard ports are supported.",
    );
  return url.href;
}

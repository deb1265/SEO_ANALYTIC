// Intentionally never backed by browser storage, cookies or an environment file.
let sessionKey = "";
const listeners = new Set<() => void>();
const operations = new Set<AbortController>();
export const hasSessionKey = () => Boolean(sessionKey);
export function subscribeSessionKey(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function clearSessionKey() {
  sessionKey = "";
  for (const controller of operations) controller.abort();
  operations.clear();
  listeners.forEach((listener) => listener());
}
export function setSessionKey(value: string) {
  const key = value
    .trim()
    .replace(/^["“”']|["“”']$/g, "")
    .trim();
  if (!/^sk-or-v1-[A-Za-z0-9_-]+$/.test(key))
    throw new Error("Enter an OpenRouter API key beginning with sk-or-v1-.");
  clearSessionKey();
  sessionKey = key;
  listeners.forEach((listener) => listener());
}
export function startSessionAnalysis() {
  if (!sessionKey)
    throw new Error(
      "Add your OpenRouter key for this tab, or turn off AI research.",
    );
  const controller = new AbortController();
  operations.add(controller);
  return {
    signal: controller.signal,
    // Read just before sending: a cleared key cannot be reused after a crawl.
    key() {
      controller.signal.throwIfAborted();
      return sessionKey;
    },
    finish() {
      operations.delete(controller);
    },
  };
}
if (typeof window !== "undefined")
  window.addEventListener("pagehide", clearSessionKey);

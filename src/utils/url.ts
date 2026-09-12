/** Normalize public HTTP(S) page URLs. Never accept credentials or local targets. */
export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value || /\s/.test(value)) throw new Error('Enter a website URL without spaces.');
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an HTTP or HTTPS URL without embedded credentials.');
  }
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.') || host.includes(':') || /^[\d.]+$/.test(host)) {
    throw new Error('Use a public website hostname, not a local address or IP.');
  }
  url.hash = '';
  return url.href;
}

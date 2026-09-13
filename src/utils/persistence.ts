/** Compatibility helper for non-secret preferences only. */
export const persistence = {
  async setItem(key: string, value: string) { window.localStorage.setItem(key, value); },
  async getItem(key: string) { return window.localStorage.getItem(key); },
  async removeItem(key: string) { window.localStorage.removeItem(key); }
};

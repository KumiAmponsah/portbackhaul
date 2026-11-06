/** Canonical production origin used for SEO canonical URLs and sitemap entries. */
export const SITE_URL: string = (import.meta.env.VITE_SITE_URL ?? "https://portbackhaul.com").replace(/\/$/, "");

export const SITE_NAME = "PortBackhaul";
export const SITE_TAGLINE = "Move Ghana Forward";

export function canonical(path: string): string {
  if (!path.startsWith("/")) return `${SITE_URL}/${path}`;
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

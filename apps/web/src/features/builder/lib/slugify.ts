const MAX_SLUG_LENGTH = 48;
const FALLBACK_SLUG = "new-endpoint";

/** "Will it rain in Budapest?" → "will-it-rain-in-budapest" */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return slug || FALLBACK_SLUG;
}

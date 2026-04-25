export function artistIdFromName(name) {
  const s = String(name || "").trim().toLowerCase();
  if (!s) return "unknown";
  return s
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const DEFAULT_PAGE_SIZE = 20;

export function parsePositiveInteger(
  value: string | string[] | undefined,
  fallback = 1,
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPageRange(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const from = (safePage - 1) * safePageSize;

  return { from, to: from + safePageSize - 1 };
}

export function getTotalPages(total: number, pageSize = DEFAULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
}

export function sanitizeSearchTerm(value: string | string[] | undefined) {
  const candidate = (Array.isArray(value) ? value[0] : value) ?? "";
  return candidate
    .replace(/[,%_()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

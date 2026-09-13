export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function postAuthRoute(role: "student" | "admin", surface: "student" | "admin"): string {
  if (surface === "admin") return role === "admin" ? "/dashboard" : "/unauthorized";
  return role === "student" ? "/dashboard" : "/unauthorized";
}

export function compactPhone(phone: string): string {
  const prefix = phone.trim().startsWith("+") ? "+" : "";
  return prefix + phone.replace(/\D/g, "");
}

export function profileCompletion(fields: Array<string | null | undefined>): number {
  if (fields.length === 0) return 100;
  const completed = fields.filter((field) => Boolean(field?.trim())).length;
  return Math.round((completed / fields.length) * 100);
}

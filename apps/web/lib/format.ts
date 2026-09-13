const INDIA_TIME_ZONE = "Asia/Kolkata";

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: INDIA_TIME_ZONE,
  }).format(new Date(value));
}

export function formatBirthDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

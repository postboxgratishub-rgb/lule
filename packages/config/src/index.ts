export const PLATFORM_DEFAULTS = {
  programName: "100-Day Learning Challenge",
  organizationName: "Learning Foundation",
  timezone: "Asia/Kolkata",
  totalDays: 100,
  videosPerDay: 10,
  videoCompletionThreshold: 90,
} as const;

export const APP_ROUTES = {
  student: {
    login: "/login",
    dashboard: "/dashboard",
  },
  admin: {
    login: "/login",
    dashboard: "/dashboard",
  },
} as const;

export const PAGINATION = {
  defaultPageSize: 25,
  maximumPageSize: 100,
} as const;

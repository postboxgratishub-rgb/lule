export function readableAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (normalized.includes("user already registered")) {
    return "An account may already exist for this email. Try signing in or resetting your password.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "We could not reach the service. Check your connection and try again.";
  }

  return message || "Something went wrong. Please try again.";
}

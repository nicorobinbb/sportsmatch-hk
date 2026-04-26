const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export function getBaseUrl(): string {
  // Development: use localhost:3000 for API
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost") {
      return "http://localhost:3000";
    }
    return `${window.location.origin}${basePath}`;
  }
  return basePath;
}

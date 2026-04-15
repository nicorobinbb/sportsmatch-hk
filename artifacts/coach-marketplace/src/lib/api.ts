const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${basePath}`;
  }
  return basePath;
}

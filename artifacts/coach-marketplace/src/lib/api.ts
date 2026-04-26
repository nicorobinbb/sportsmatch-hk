const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const defaultProdApiBaseUrl = "https://sportsmatch-hk-api-server.vercel.app";

export function getBaseUrl(): string {
  // Production/staging override for external API host.
  if (envApiBaseUrl) return envApiBaseUrl;

  // Development: use localhost:3000 for API
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost") {
      return "http://localhost:3000";
    }
    return defaultProdApiBaseUrl;
  }
  return envApiBaseUrl || defaultProdApiBaseUrl || basePath;
}

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const defaultProdApiBaseUrl = "https://sportsmatch-hk-api-server-git-main-nicorobinbbs-projects.vercel.app";

function normalizeApiBaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const normalized = url.replace(/\/$/, "");
  return normalized.replace(
    /sportsmatch-hk-api-server-[a-z0-9]+-nicorobinbbs-projects\.vercel\.app/i,
    "sportsmatch-hk-api-server-git-main-nicorobinbbs-projects.vercel.app"
  );
}

const envApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

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

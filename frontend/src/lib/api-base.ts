export function getAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  return url.replace(/\/$/, "");
}

export function apiPath(path: string): string {
  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_URL ?? ""
      : getAppUrl();

  if (!base) return `/api${path}`;
  return `${base.replace(/\/$/, "")}/api${path}`;
}

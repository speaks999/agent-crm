const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const getPublicBaseUrl = (): string => {
  const explicitBase =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (explicitBase) {
    return trimTrailingSlash(explicitBase);
  }

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) {
    return trimTrailingSlash(`https://${vercelUrl}`);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};

export const buildPublicUrl = (path: string): string => {
  const base = getPublicBaseUrl();
  if (!base) return path;
  return new URL(path, base).toString();
};

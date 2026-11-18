/**
 * Route prefixes that are hidden when the app is running as an installed PWA.
 * Add or remove route prefixes here to control PWA visibility in the sidebar and route guard.
 */
export const PWA_HIDDEN_ROUTE_PREFIXES = ["/dashboard/mrp"] as const;

export function isRouteHiddenInPwa(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PWA_HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}


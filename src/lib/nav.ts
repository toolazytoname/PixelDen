export const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/games/raiden", label: "射击" },
  { href: "/games/dna-helix", label: "科学" },
  { href: "/games/rubiks-cube", label: "益智" },
  { href: "/about", label: "关于" },
] as const;

export function navItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

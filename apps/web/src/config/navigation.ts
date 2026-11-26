import {
  BookOpenIcon,
  HouseIcon,
  LayersIcon,
  LayoutGridIcon,
  type LucideIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import type { Route } from "next";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
}

const HOME: NavItem = { href: "/", label: "Home", icon: HouseIcon };
const EXPLORE: NavItem = { href: "/marketplace", label: "Explore", icon: LayoutGridIcon };
const COMMUNITY: NavItem = { href: "/community", label: "Community", icon: UsersIcon };
const SEARCH: NavItem = { href: "/search", label: "Search", icon: SearchIcon };
const MY_APIS: NavItem = { href: "/my-apis", label: "My APIs", icon: LayersIcon };
const DOCS: NavItem = { href: "/docs", label: "Docs", icon: BookOpenIcon };
const CREATE: NavItem = { href: "/create", label: "Create API", icon: PlusIcon };

/** Text links in the header. Search and "Create" have their own controls. */
export const headerNavigation: readonly NavItem[] = [EXPLORE, COMMUNITY, MY_APIS, DOCS];

/** Bottom tab bar on small screens. */
export const mobileNavigation: readonly NavItem[] = [HOME, EXPLORE, SEARCH, COMMUNITY, MY_APIS];

/** Every destination, for the command menu. */
export const allPages: readonly NavItem[] = [
  HOME,
  CREATE,
  EXPLORE,
  SEARCH,
  COMMUNITY,
  MY_APIS,
  DOCS,
];

/** Active when the pathname equals the item or is nested under it ("/" only matches exactly). */
export function isNavItemActive(pathname: string, href: Route): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

import {
  LayoutDashboard,
  ListChecks,
  Code2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Minimal, intentional navigation. Only shipped features appear here;
 * Notes, Revision and Analytics return once they actually exist.
 */
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Striver A2Z", href: "/roadmaps/striver-a2z", icon: ListChecks },
  { label: "Code Files", href: "/code-files", icon: Code2 },
];

/** Mobile bottom navigation mirrors the sidebar. */
export const bottomNavItems: NavItem[] = navItems;

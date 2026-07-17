import {
  LayoutDashboard,
  Map,
  NotebookPen,
  Bookmark,
  RotateCcw,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Routes not yet implemented in this spec; shown but flagged. */
  comingSoon?: boolean;
};

/** Shared navigation config consumed by both the sidebar and the bottom nav. */
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Roadmaps", href: "/roadmaps", icon: Map },
  { label: "Notes", href: "/notes", icon: NotebookPen, comingSoon: true },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark, comingSoon: true },
  { label: "Revision", href: "/revision", icon: RotateCcw, comingSoon: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3, comingSoon: true },
];

/** Items shown in the compact mobile bottom navigation (max 5). */
export const bottomNavItems: NavItem[] = navItems.slice(0, 5);

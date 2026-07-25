"use client";

import {
  Footprints,
  Flame,
  Trophy,
  CheckCircle2,
  Target,
  Award,
  BookOpen,
  Layers,
  Brain,
  GraduationCap,
  CalendarCheck,
  FileCode2,
  Code2,
  Rocket,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { GitHubMark } from "@/components/ui/github-mark";

const ICONS: Record<string, LucideIcon> = {
  Footprints,
  Flame,
  Trophy,
  CheckCircle2,
  Target,
  Award,
  BookOpen,
  Layers,
  Brain,
  GraduationCap,
  CalendarCheck,
  FileCode2,
  Code2,
  Rocket,
  Clock,
};

/** Maps an achievement icon key to a Lucide icon or the custom GitHub mark. */
export function AchievementIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  if (icon === "github") return <GitHubMark className={className} />;
  const Cmp = ICONS[icon] ?? Trophy;
  return <Cmp className={className} />;
}

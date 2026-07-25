"use client";

import { useTransition } from "react";
import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(user: SessionUser) {
  const source = user.name || user.email || "?";
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Accessible account dropdown. Exposes only actions that exist today —
 * Settings is present but disabled ("Soon") so we never link to a broken route.
 */
export function UserMenu({ user }: { user: SessionUser }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-8">
          <AvatarImage src={user.image ?? undefined} alt="" />
          <AvatarFallback className="bg-secondary text-xs">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {user.name && (
            <span className="truncate text-sm font-medium">{user.name}</span>
          )}
          {user.email && (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="justify-between gap-2">
          <span className="flex items-center gap-2">
            <Settings className="size-4" />
            Settings
          </span>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Soon
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={pending}
          onClick={() => startTransition(() => void signOutAction())}
          className="cursor-pointer gap-2"
        >
          <LogOut className="size-4" />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

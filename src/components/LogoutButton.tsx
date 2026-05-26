"use client";

import { Button } from "@heroui/react";
import { LogOut } from "lucide-react";
import { signOut } from "@/shared/lib/auth/client";
import { trackCache } from "@/lib/track-cache";

export const LogoutButton: React.FC = () => (
  <Button
    isIconOnly
    variant="ghost"
    size="sm"
    aria-label="ログアウト"
    onPress={() => {
      trackCache.clear();
      signOut().catch(console.error);
    }}
    className="bg-white/10 text-foreground hover:bg-white/20"
  >
    <LogOut className="h-4 w-4" />
  </Button>
);

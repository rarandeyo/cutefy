"use client";

import { Button } from "@heroui/react";
import { LogOut } from "lucide-react";
import { signOut } from "@/shared/lib/auth/client";

type LogoutButtonProps = {
  onBeforeLogout?: () => void;
};

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onBeforeLogout }) => {
  const handleLogout = (): void => {
    onBeforeLogout?.();
    signOut().catch(() => window.alert("ログアウトに失敗しました"));
  };

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label="ログアウト"
      onPress={handleLogout}
      className="bg-white/10 text-foreground hover:bg-white/20"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
};

"use client";

import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { trackCache } from "@/features/playlist-wizard/lib/track-cache";

export const LogoutWithCacheClear: React.FC = () => (
  <LogoutButton onBeforeLogout={trackCache.clear} />
);

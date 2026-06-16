import { Github, Settings } from "lucide-react";
import Link from "next/link";
import { LogoutWithCacheClear } from "@/features/playlist-wizard/components/LogoutWithCacheClear";

export const Header: React.FC = () => (
  <header className="flex items-center justify-between pb-8">
    <Link
      href="/"
      className="text-lg font-bold tracking-tight md:text-xl hover:opacity-80 transition-opacity"
    >
      Cutefy
    </Link>
    <div className="flex items-center gap-1">
      <a
        href="https://github.com/rarandeyo/create-spotify-playlist"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-foreground transition-colors hover:bg-white/20"
      >
        <Github className="h-4 w-4" />
      </a>
      <Link
        href="/home/settings"
        aria-label="設定"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-foreground transition-colors hover:bg-white/20"
      >
        <Settings className="h-4 w-4" />
      </Link>
      <LogoutWithCacheClear />
    </div>
  </header>
);

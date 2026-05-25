import type React from "react";
import { Github, ListMusic } from "lucide-react";
import Link from "next/link";
import { LoginParticles } from "./LoginParticles";
import { SpotifyLoginButton } from "./SpotifyLoginButton";

type LoginSectionProps = Readonly<{
  isLoggedIn: boolean;
}>;

export const LoginSection: React.FC<LoginSectionProps> = ({ isLoggedIn }) => (
  <div className="relative flex min-h-screen flex-col items-center overflow-hidden">
    <LoginParticles />

    <div
      className="pointer-events-none absolute top-1/4 left-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
      style={{ background: "radial-gradient(circle, oklch(0.6 0.15 155), transparent 70%)" }}
      aria-hidden="true"
    />

    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-12 px-6 pt-16 pb-8">
      <div className="flex animate-[fade-in-up-lg_0.8s_cubic-bezier(0.16,1,0.3,1)_both] flex-col items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-spotify-green to-emerald-400 shadow-[0_0_40px_rgba(29,185,84,0.3)]">
            <ListMusic className="h-10 w-10 text-black" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-1 -right-1 flex h-6 w-6 animate-[pop-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_0.6s_both] items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-lg">
            ♪
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="bg-gradient-to-r from-white via-white to-spotify-green bg-clip-text font-outfit text-6xl font-extrabold tracking-tighter text-transparent md:text-7xl">
            Cutefy
          </h1>
          <p className="max-w-sm text-center text-lg leading-relaxed text-white/50">
            お気に入りの曲から
            <br className="sm:hidden" />
            期間を指定してプレイリストを作成
          </p>
        </div>
      </div>

      <div className="animate-[fade-in-up-sm_0.7s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
        {isLoggedIn ? (
          <Link
            href="/app"
            className="group relative inline-flex items-center justify-center rounded-full bg-spotify-green px-10 py-3.5 text-base font-bold text-black shadow-[0_0_30px_rgba(29,185,84,0.25)] transition-all duration-300 hover:bg-spotify-green-hover hover:shadow-[0_0_50px_rgba(29,185,84,0.4)] hover:scale-[1.03]"
          >
            アプリへ
          </Link>
        ) : (
          <SpotifyLoginButton />
        )}
      </div>
    </main>

    <footer className="relative z-10 animate-[fade-in_0.6s_ease_0.8s_both] pb-8">
      <a
        href="https://github.com/rarandeyo/create-spotify-playlist"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-white/30 transition-colors hover:text-white/60"
      >
        <Github className="h-3.5 w-3.5" />
        GitHub
      </a>
    </footer>
  </div>
);

"use client";

import { signInWithSpotify } from "@/shared/lib/auth/client";
import { Button } from "@heroui/react";
import { Github, ListMusic } from "lucide-react";
import Link from "next/link";
import type React from "react";
import type { Particle } from "@/features/auth/lib/particles";

type LoginSectionProps = {
  isLoggedIn: boolean;
  particles: readonly Particle[];
};

export const LoginSection: React.FC<LoginSectionProps> = ({ isLoggedIn, particles }) => {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* Floating music note particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute animate-[float-up_linear_infinite] text-spotify-green"
            style={{
              left: `${p.x}%`,
              bottom: "-5%",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              fontSize: `${p.size}px`,
              opacity: p.opacity,
            }}
          >
            {p.note}
          </span>
        ))}
      </div>

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.6 0.15 155), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Hero section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-12 px-6 pt-16 pb-8">
        {/* Logo + Title */}
        <div className="flex animate-[fade-in_0.8s_cubic-bezier(0.16,1,0.3,1)_both] flex-col items-center gap-5">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-spotify-green to-emerald-400 shadow-[0_0_40px_rgba(29,185,84,0.3)]">
              <ListMusic className="h-10 w-10 text-black" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-1 -right-1 flex h-6 w-6 animate-[scale-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_0.6s_both] items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-lg">
              ♪
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1
              className="bg-gradient-to-r from-white via-white to-spotify-green bg-clip-text font-outfit text-6xl font-extrabold tracking-tighter text-transparent md:text-7xl"
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
            >
              Cutefy
            </h1>
            <p className="max-w-sm text-center text-lg leading-relaxed text-white/50">
              お気に入りの曲から
              <br className="sm:hidden" />
              期間を指定してプレイリストを作成
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="animate-[fade-in_0.7s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
          {isLoggedIn ? (
            <Link
              href="/app"
              className="group relative inline-flex items-center justify-center rounded-full bg-spotify-green px-10 py-3.5 text-base font-bold text-black shadow-[0_0_30px_rgba(29,185,84,0.25)] transition-all duration-300 hover:bg-spotify-green-hover hover:shadow-[0_0_50px_rgba(29,185,84,0.4)] hover:scale-[1.03]"
            >
              アプリへ
            </Link>
          ) : (
            <Button
              onPress={() => signInWithSpotify().catch(console.error)}
              className="group relative rounded-full bg-spotify-green px-10 py-6 text-base font-bold text-black shadow-[0_0_30px_rgba(29,185,84,0.25)] transition-all duration-300 hover:bg-spotify-green-hover hover:shadow-[0_0_50px_rgba(29,185,84,0.4)] hover:scale-[1.03]"
            >
              <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current" aria-hidden="true">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Spotifyでログイン
            </Button>
          )}
        </div>
      </main>

      {/* Footer */}
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
};

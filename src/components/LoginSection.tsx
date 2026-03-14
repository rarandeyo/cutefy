import { signInWithSpotify } from "@/lib/auth-client";
import { Button } from "@heroui/react";
import { Music } from "lucide-react";
import type React from "react";

export const LoginSection: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-spotify-green">
        <Music className="h-8 w-8 text-black" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Playlist Creator</h1>
      <p className="text-center text-text-subdued">
        お気に入りの曲から期間を指定してプレイリストを作成
      </p>
    </div>
    <Button
      onPress={() => signInWithSpotify()}
      className="rounded-full bg-spotify-green px-8 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover"
    >
      Spotifyでログイン
    </Button>
  </div>
);

import { Result } from "@praha/byethrow";
import { redirect } from "next/navigation";
import { fetchAllSavedTracks, type TrackWithAddedAt } from "@/shared/lib/spotify";
import { getSpotifyClientForCurrentUser } from "@/shared/lib/spotify/server";
import { MainContent } from "@/features/playlist-wizard/components/MainContent";

export const dynamic = "force-dynamic";

const loadInitialTracks = async (): Promise<readonly TrackWithAddedAt[]> => {
  const result = await Result.pipe(
    getSpotifyClientForCurrentUser(),
    Result.andThen(({ sdk }) => fetchAllSavedTracks(sdk)),
  );
  if (Result.isSuccess(result)) {
    return result.value;
  }
  if (result.error.kind === "SessionNotFound" || result.error.kind === "AccessTokenUnavailable") {
    redirect("/");
  }
  // 予期しない失敗は error boundary (error.tsx) に委ねる
  throw new Error(`Failed to load saved tracks: ${result.error.kind}`);
};

export default async function Page() {
  const initialTracks = await loadInitialTracks();
  return <MainContent initialTracks={initialTracks} />;
}

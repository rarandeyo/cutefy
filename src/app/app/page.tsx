import { redirect } from "next/navigation";
import { fetchAllSavedTracks, type TrackWithAddedAt } from "@/shared/lib/spotify";
import { getSpotifyClientForCurrentUser, UnauthorizedError } from "@/shared/lib/spotify/server";
import { MainContent } from "@/features/playlist-wizard/components/MainContent";

const loadInitialTracks = async (): Promise<readonly TrackWithAddedAt[]> => {
  try {
    const { sdk } = await getSpotifyClientForCurrentUser();
    return await fetchAllSavedTracks(sdk);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect("/");
    }
    throw err;
  }
};

export default async function Page() {
  const initialTracks = await loadInitialTracks();
  return <MainContent initialTracks={initialTracks} />;
}

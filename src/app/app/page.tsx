import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PlaylistCreationContainer } from "@/features/playlist-creation/PlaylistCreationContainer";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return <PlaylistCreationContainer />;
}

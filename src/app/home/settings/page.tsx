import { Result } from "@praha/byethrow";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/shared/lib/auth/server";
import { createDb } from "@/shared/lib/db";
import { UserId } from "@/shared/types/user-id";
import { getSyncSettingsEnabled } from "@/features/sync-settings/lib/sync-settings-repo";
import { SettingsContent } from "@/features/sync-settings/components/SettingsContent";

export const dynamic = "force-dynamic";

export default async function Page() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const userId = UserId.parse(session.user.id);
  if (Result.isFailure(userId)) {
    redirect("/");
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = createDb(env.DB);
  const initialEnabled = await getSyncSettingsEnabled(db, userId.value);
  if (Result.isFailure(initialEnabled)) {
    // DB 障害は error boundary (error.tsx) に委ねる
    throw new Error("Failed to load sync settings");
  }

  return <SettingsContent initialEnabled={initialEnabled.value} />;
}

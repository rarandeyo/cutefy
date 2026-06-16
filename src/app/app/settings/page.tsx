import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/shared/lib/auth/server";
import { createDb } from "@/shared/lib/db";
import { createUserId } from "@/shared/types/brands";
import { getSyncSettingsEnabled } from "@/features/sync-settings/lib/sync-settings-repo";
import { SettingsContent } from "@/features/sync-settings/components/SettingsContent";

export const dynamic = "force-dynamic";

export default async function Page() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = createDb(env.DB);
  const initialEnabled = await getSyncSettingsEnabled(db, createUserId(session.user.id));

  return <SettingsContent initialEnabled={initialEnabled} />;
}

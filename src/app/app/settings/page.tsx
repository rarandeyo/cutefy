import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/features/settings/components/SettingsContent";
import { getSyncEnabled } from "@/features/settings/server/getSyncSettings";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const initialEnabled = await getSyncEnabled(session.user.id);

  return <SettingsContent initialEnabled={initialEnabled} />;
}

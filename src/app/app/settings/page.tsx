import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { SettingsContent } from "@/components/SettingsContent";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return <SettingsContent />;
}

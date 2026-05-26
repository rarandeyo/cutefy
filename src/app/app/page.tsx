import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { MainContent } from "@/components/MainContent";

export default async function Page(): Promise<React.JSX.Element> {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return <MainContent />;
}

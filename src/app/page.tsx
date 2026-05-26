import { headers } from "next/headers";
import type React from "react";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { LoginSection } from "@/components/LoginSection";

export default async function Page(): Promise<React.JSX.Element> {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <LoginSection isLoggedIn={!!session} />;
}

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LoginSection } from "@/components/LoginSection";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <LoginSection isLoggedIn={!!session} />;
}

import { Suspense } from "react";
import { AuthGate } from "@/components/AuthGate";

export default function Page() {
  return (
    <Suspense>
      <AuthGate />
    </Suspense>
  );
}

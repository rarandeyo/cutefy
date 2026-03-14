"use client";

import type React from "react";
import { Spinner } from "@heroui/react";
import { useSession } from "@/lib/auth-client";
import { LoginSection } from "@/components/LoginSection";
import { MainContent } from "@/components/MainContent";

export const AuthGate: React.FC = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" color="current" className="text-text-subdued" />
      </div>
    );
  }

  if (!session) {
    return <LoginSection />;
  }

  return <MainContent />;
};

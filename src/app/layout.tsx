import type { Metadata } from "next";
import type React from "react";
import { Outfit, Geist } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Cutefy",
  description: "お気に入りの曲から期間を指定してプレイリストを作成",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="ja" className={cn("font-sans", geist.variable)}>
      <body className={cn(outfit.variable, "antialiased")}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}

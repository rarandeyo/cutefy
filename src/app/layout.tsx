import type { Metadata } from "next";
import { Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Spotify Playlist Creator",
  description: "お気に入りの曲から期間を指定してプレイリストを作成",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="ja" className={cn("font-sans", geist.variable)}>
    <body className={`${outfit.variable} antialiased`}>{children}</body>
  </html>
);

export default RootLayout;

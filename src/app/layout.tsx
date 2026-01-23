import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify Playlist Creator",
  description: "お気に入りの曲から期間を指定してプレイリストを作成",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="ja">
    <body className="antialiased">{children}</body>
  </html>
);

export default RootLayout;

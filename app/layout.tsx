// app/layout.tsx
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GoogleOneTap } from "@/components/google-one-tap"; // ←今のプロジェクトがnamedならこのまま
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "学習ロードマップサイト",
  description: "有向グラフで学習順序を表示するサイト",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={geistSans.className} suppressHydrationWarning>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 w-full flex flex-col items-center">
              <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 w-full">
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </ThemeProvider>
        {/* Google One Tap（必要な場合だけ） */}
        <GoogleOneTap />
      </body>
    </html>
  );
}

// app/layout.tsx
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from 'next-themes';
// ダーク/ライトテーマ切り替え
import { Geist } from 'next/font/google';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { GoogleOneTap } from '@/components/google-one-tap';

import './globals.css';

// デフォルトのサイトURL（Vercel環境変数があれば本番URL、なければローカル）
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

// ページ全体で使うメタデータ
export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'LearnGraph - 学びの順序を"見える化"',
  description:
    '教材のつながりを有向グラフで表示し、あなたに合ったロードマップを自動生成します。',
};

// フォント設定
const geistSans = Geist({
  display: 'swap',
  subsets: ['latin'],
});

// 全ページ共通のレイアウト
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={geistSans.className} suppressHydrationWarning>
      <head>
        {/* Google One Tapのクライアントスクリプト */}
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body className="bg-background text-foreground">
        {/* テーマ切り替え（system / light / dark） */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* ページ全体のレイアウト構造 */}
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

        {/* GoogleOneTap ログインUI*/}
        <GoogleOneTap />

        {/* トースト通知 */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

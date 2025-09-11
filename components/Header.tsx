import HeaderAuth from "@/components/header-auth";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        {/* 左側: ロゴ */}
        <div className="flex items-center">
          <Link href="/" className="font-bold text-lg">
            LearnGraph
          </Link>
        </div>

        {/* 右側: ドキュメントとログイン/ユーザー情報 */}
        <div className="flex items-center gap-6">
          <Link
            href="/docs" // ドキュメントページのパス（仮）
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:block"
          >
            ドキュメント
          </Link>

          <HeaderAuth />
        </div>
      </div>
    </header>
  );
};

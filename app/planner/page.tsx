import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '学習プランナー - LearnGraph',
  description: '期間・時間・予算から最適な学習プランを自動生成します',
};

export default function PlannerPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* パンくず */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          ホーム
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">プランナー</span>
      </nav>

      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          学習プランナー
        </h1>
        <p className="text-muted-foreground">
          期間・学習時間・予算を入力すると、推奨順序で学習プランを自動生成します。
        </p>
      </div>

      {/* プレースホルダー */}
      <div className="min-h-[400px] border rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="font-medium text-gray-900 mb-2">
            プランナー機能を準備中
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            入力フォーム・結果テーブル・保存機能を実装予定です
          </p>
          <p className="text-xs text-gray-500">スプリント2で実装予定</p>
        </div>
      </div>
    </div>
  );
}

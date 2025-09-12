import Link from 'next/link';

import { TopicView } from '@/components/TopicView';

// 各トピックページ (例: /topics/JavaScript)
// App Routerのparamsで[slug]を受け取る
export default async function TopicPage({
  params,
}: {
  params: { slug: string };
}) {
  // URLパラメータをデコードしてタイトルに使用する
  const title = decodeURIComponent(params.slug);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* パンくずリスト */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          ホーム
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">
          教材一覧と学習順序（グラフ表示）を切り替えられます。
        </p>
      </div>

      {/* トピック詳細(リスト/グラフ表示） */}
      <TopicView slug={params.slug} />
    </div>
  );
}

import Link from 'next/link';
import { TopicView } from '@/components/TopicView';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;         // ← await 必須
  const title = decodeURIComponent(slug);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          ホーム
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">教材一覧と学習順序（グラフ表示）を切り替えられます。</p>
      </div>

      <TopicView slug={slug} />
    </div>
  );
}
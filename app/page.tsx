// app/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// テキスト
export const metadata: Metadata = {
  title: 'LearnGraph - 学びの順序を"見える化"',
  description:
    '教材のつながりを有向グラフで表示し、あなたに合ったロードマップを自動生成します。',
};

// ここはHomePageの外(トップレベル)で定義！
const topics = [
  {
    slug: 'web-dev',
    title: 'Web開発',
    description: 'HTML/CSS/JSフレームワークの基礎から',
    icon: '</>',
  },
  {
    slug: 'ai-ml',
    title: 'AI・機械学習',
    description: '数学・Python・モデルの基礎から',
    icon: '⚡',
  },
  {
    slug: 'basic-math',
    title: '基礎数学',
    description: '離散数学・線形代数・確率統計',
    icon: '📐',
  },
];

const steps = [
  {
    number: 1,
    title: 'トピックを選ぶ',
    description: '学習したい分野を選択します',
  },
  {
    number: 2,
    title: 'リストで教材を比較',
    description: '教材の詳細を一覧で確認できます',
  },
  {
    number: 3,
    title: 'グラフで順序を確認',
    description: '学習プランを自動生成します',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-3">
          学びの順序を"見える化"
        </h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          教材のつながりを有向グラフで表示し、あなたに合ったロードマップを自動生成します。
        </p>
      </section>
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-6">トピックを選択</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {topics.map((topic) => (
            <Link key={topic.slug} href={`/t/${topic.slug}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="text-3xl mb-2">{topic.icon}</div>
                  <CardTitle>{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-6">使い方</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {step.number}
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

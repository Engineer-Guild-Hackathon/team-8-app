'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type NodeRow = {
  id: string;
  title: string;
  resourceType?: string;
  difficulty?: number;
  durationMin?: number; // 分
  costAmount?: number; // 円
  url?: string;
};

const JPY = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

function clampDifficulty(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isFinite(n)) return Math.max(0, Math.min(5, Math.round(n)));
  return undefined;
}
function formatDuration(min?: number) {
  if (!Number.isFinite(min!)) return '-';
  if (min! < 60) return `${min}分`;
  const h = Math.floor(min! / 60);
  const m = min! % 60;
  return m ? `${h}時間${m}分` : `${h}時間`;
}

export const MaterialList = ({ slug }: { slug: string }) => {
  const [rows, setRows] = useState<NodeRow[]>([]);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10 as 5 | 10 | 20 | 50);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sortOptions = [
    'おすすめ',
    '難易度低',
    '難易度高',
    '時間短',
    '時間長',
  ] as const;
  type SortBy = (typeof sortOptions)[number];
  const [sortBy, setSortBy] = useState<SortBy>('おすすめ');

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    fetch(`/api/graph?slug=${encodeURIComponent(slug)}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data?.nodes)
          ? data.nodes
          : Array.isArray(data?.items)
            ? data.items
            : [];
        const mapped: NodeRow[] = arr.map((n: any) => ({
          id: String(n.id),
          title: String(n.title ?? ''),
          resourceType: n.resourceType ?? n.type ?? 'other',
          difficulty: clampDifficulty(n.difficulty),
          durationMin: Number.isFinite(Number(n.durationMin ?? n.duration_min))
            ? Number(n.durationMin ?? n.duration_min)
            : undefined,
          costAmount: Number.isFinite(Number(n.costAmount ?? n.cost_amount))
            ? Number(n.costAmount ?? n.cost_amount)
            : undefined,
          url: n.url ?? undefined,
        }));
        setRows(mapped);
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') setErr('教材の読み込みに失敗しました');
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [slug]);

  // 検索・並び替え
  const filtered = useMemo(() => {
    const term = dq.trim().toLowerCase();
    let list = term
      ? rows.filter((r) => r.title.toLowerCase().includes(term))
      : [...rows];

    switch (sortBy) {
      case '難易度低':
        list.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
        break;
      case '難易度高':
        list.sort((a, b) => (b.difficulty ?? -1) - (a.difficulty ?? -1));
        break;
      case '時間短':
        list.sort(
          (a, b) => (a.durationMin ?? 99999) - (b.durationMin ?? 99999)
        );
        break;
      case '時間長':
        list.sort((a, b) => (b.durationMin ?? -1) - (a.durationMin ?? -1));
        break;
      case 'おすすめ':
      default:
        list.sort((a, b) => {
          const freeA = (a.costAmount ?? 0) === 0 ? 0 : 1;
          const freeB = (b.costAmount ?? 0) === 0 ? 0 : 1;
          if (freeA !== freeB) return freeA - freeB;
          const da = a.durationMin ?? 99999;
          const db = b.durationMin ?? 99999;
          if (da !== db) return da - db;
          return a.title.localeCompare(b.title, 'ja');
        });
        break;
    }
    return list;
  }, [dq, rows, sortBy]);

  // ページ計算
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const current = Math.min(currentPage, totalPages);
  const startIndex = (current - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // 検索・並び替え時に先頭へ
  useEffect(() => {
    setCurrentPage(1);
  }, [dq, sortBy, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* 検索・並び替え・表示件数 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {/* アイコン */}
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Input
            type="text"
            placeholder="教材を検索..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10 w-full"
            aria-label="教材検索"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">表示件数:</span>
            <select
              value={itemsPerPage}
              onChange={(e) =>
                setItemsPerPage(Number(e.target.value) as 5 | 10 | 20 | 50)
              }
              className="px-2 py-1 border border-input bg-background rounded text-sm"
            >
              <option value={5}>5件</option>
              <option value={10}>10件</option>
              <option value={20}>20件</option>
              <option value={50}>50件</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">並び替え:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1.5 border border-input bg-background rounded-md text-sm"
              aria-label={`並び替え（現在: ${sortBy}）`}
            >
              {sortOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* 状態表示 */}
      {loading && (
        <div className="text-center text-sm text-muted-foreground">
          教材を読み込み中...
        </div>
      )}
      {err && <div className="text-center text-sm text-red-600">{err}</div>}

      {/* テーブル */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="text-left p-4 font-medium">
                  教材名
                </th>
                <th scope="col" className="text-left p-4 font-medium">
                  種類
                </th>
                <th scope="col" className="text-left p-4 font-medium">
                  難易度
                </th>
                <th scope="col" className="text-left p-4 font-medium">
                  時間
                </th>
                <th scope="col" className="text-left p-4 font-medium">
                  費用
                </th>
                <th scope="col" className="text-left p-4 font-medium">
                  リンク
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center p-8 text-muted-foreground"
                  >
                    {rows.length === 0
                      ? '教材を読み込み中...'
                      : '該当する教材が見つかりません'}
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => {
                  const d = clampDifficulty(row.difficulty);
                  const filled = d ?? undefined;
                  return (
                    <tr key={row.id} className="border-t hover:bg-muted/30">
                      <td className="p-4 font-medium">{row.title}</td>
                      <td className="p-4">
                        <span
                          className="inline-block px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                          title={row.resourceType}
                        >
                          {row.resourceType || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        {filled !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{filled}/5</span>
                            <div
                              className="flex gap-1"
                              aria-label={`難易度 ${filled} / 5`}
                            >
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${i < filled ? 'bg-primary' : 'bg-muted'}`}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">{formatDuration(row.durationMin)}</td>
                      <td className="p-4">
                        {row.costAmount !== undefined ? (
                          row.costAmount === 0 ? (
                            <span className="text-green-600 font-medium">
                              無料
                            </span>
                          ) : (
                            JPY.format(row.costAmount)
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4">
                        {row.url ? (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              開く
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {totalItems} 件中 {startIndex + 1} -{' '}
            {Math.min(endIndex, totalItems)} 件を表示
          </div>

          <div
            className="flex items-center gap-2"
            role="navigation"
            aria-label="ページネーション"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={current === 1}
            >
              前へ
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  const show =
                    page === 1 ||
                    page === totalPages ||
                    (page >= current - 1 && page <= current + 1);

                  if (!show) {
                    if (page === 2 && current > 4)
                      return (
                        <span
                          key="l-ellipsis"
                          className="px-2 text-muted-foreground"
                        >
                          …
                        </span>
                      );
                    if (page === totalPages - 1 && current < totalPages - 3)
                      return (
                        <span
                          key="r-ellipsis"
                          className="px-2 text-muted-foreground"
                        >
                          …
                        </span>
                      );
                    return null;
                  }
                  const active = page === current;
                  return (
                    <Button
                      key={page}
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[2rem]"
                      aria-current={active ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  );
                }
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={current === totalPages}
            >
              次へ
            </Button>
          </div>
        </div>
      )}

      {/* 件数サマリ */}
      <div className="text-sm text-muted-foreground text-center">
        {totalItems} / {rows.length} 件の教材を表示
      </div>
    </div>
  );
};

'use client';

import { useMemo } from 'react';

// 前提の下書き（矢印・ノードのレイアウト例）
export const GraphView = ({ slug }: { slug: string }) => {
  // 将来的な拡縮用。現状は固定1倍。
  const scale = useMemo(() => 'scale(1)', []);

  return (
    <div className="space-y-4">
      {/* キャンバス枠 */}
      <div className="relative min-h-[600px] border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          {/* transformOrigin: 中央基準で拡縮 */}
          <div style={{ transform: scale, transformOrigin: 'center center' }}>
            <svg
              width={600}
              height={400}
              className="drop-shadow-sm"
              role="img"
              aria-label={`${slug} の学習順序グラフ`}
            >
              {/* 矢印ヘッドや発光などの定義群 */}
              <defs>
                <marker
                  id={`arrow-${slug}`}
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  fill="#6366f1"
                >
                  <path d="M0,0 L0,6 L9,3 z" />
                </marker>

                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* === エッジ（学習順序） === */}
              <g aria-label="Edges">
                <line
                  x1="120" y1="150" x2="280" y2="150"
                  stroke="#6366f1" strokeWidth="2"
                  markerEnd={`url(#arrow-${slug})`}
                  className="transition-colors hover:stroke-blue-600"
                />
                <line
                  x1="120" y1="150" x2="200" y2="250"
                  stroke="#6366f1" strokeWidth="2"
                  markerEnd={`url(#arrow-${slug})`}
                  className="transition-colors hover:stroke-blue-600"
                />
                <line
                  x1="280" y1="150" x2="380" y2="250"
                  stroke="#6366f1" strokeWidth="2"
                  markerEnd={`url(#arrow-${slug})`}
                  className="transition-colors hover:stroke-blue-600"
                />
                <line
                  x1="200" y1="250" x2="380" y2="250"
                  stroke="#6366f1" strokeWidth="2"
                  markerEnd={`url(#arrow-${slug})`}
                  className="transition-colors hover:stroke-blue-600"
                />
              </g>

              {/* === ノード（教材） === */}
              <g aria-label="Nodes">
                {/* 基礎 */}
                <circle
                  cx="120" cy="150" r="20"
                  fill="#3b82f6" stroke="#1e40af" strokeWidth="2"
                  className="transition-colors hover:fill-blue-600 cursor-pointer"
                  filter="url(#glow)"
                />
                <text x="120" y="155" fontSize="11" fill="white" textAnchor="middle" fontWeight="bold">
                  基礎
                </text>

                {/* 中級 */}
                <circle
                  cx="280" cy="150" r="20"
                  fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2"
                  className="transition-colors hover:fill-purple-600 cursor-pointer"
                  filter="url(#glow)"
                />
                <text x="280" y="155" fontSize="11" fill="white" textAnchor="middle" fontWeight="bold">
                  中級
                </text>

                {/* 応用A */}
                <circle
                  cx="200" cy="250" r="18"
                  fill="#10b981" stroke="#059669" strokeWidth="2"
                  className="transition-colors hover:fill-green-600 cursor-pointer"
                  filter="url(#glow)"
                />
                <text x="200" y="255" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
                  応用A
                </text>

                {/* 応用B */}
                <circle
                  cx="380" cy="250" r="18"
                  fill="#f59e0b" stroke="#d97706" strokeWidth="2"
                  className="transition-colors hover:fill-yellow-600 cursor-pointer"
                  filter="url(#glow)"
                />
                <text x="380" y="255" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
                  応用B
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* プレースホルダー表示 */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-gray-600 border">
          📊 {slug} - D3.js実装予定
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>学習順序が矢印で示されます。ノードをクリックすると教材詳細が表示されます。</p>
      </div>
    </div>
  );
};

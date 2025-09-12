'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const GraphView = ({ slug }: { slug: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(100);

  const scale = useMemo(() => `scale(${(zoom/100).toFixed(2)})`, [zoom]);

  return (
    <div className="space-y-6">
      {/* Controls …（既存どおり） */}

      <div className="flex gap-6">
        {/* Legend …（既存どおり） */}

        {/* Graph Area */}
        <div className="flex-1 min-h-[600px] border rounded-lg bg-gray-50 overflow-hidden">
          <div className="w-full h-full grid place-items-center">
            <div style={{ transform: scale, transformOrigin: 'center center' }}>
              {/* ここは次タスクでD3に置換。暫定のSVGで雰囲気だけ */}
              <svg width={600} height={400}>
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" />
                  </marker>
                </defs>
                <g>
                  <line x1="100" y1="100" x2="300" y2="200" stroke="#bbb" strokeWidth="2" markerEnd="url(#arrow)" />
                  <circle cx="100" cy="100" r="10" />
                  <text x="100" y="85" fontSize="12" textAnchor="middle">A</text>
                  <circle cx="300" cy="200" r="10" />
                  <text x="300" y="185" fontSize="12" textAnchor="middle">B</text>
                </g>
              </svg>
              <p className="text-xs text-center text-gray-500 mt-2">Topic: {slug}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

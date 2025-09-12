'use client';

import * as d3 from 'd3';

import { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  title: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  difficulty?: number;
  resourceType?: string;
}

interface Edge {
  source: string | Node;
  target: string | Node;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface D3GraphCanvasProps {
  slug: string;
  width?: number;
  height?: number;
}

export const D3GraphCanvas = ({
  slug,
  width = 800,
  height = 600,
}: D3GraphCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  // データ取得
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch(
          `/api/graph?topicId=${encodeURIComponent(slug)}`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const apiData = await response.json();

        const nodes: Node[] = (apiData?.nodes ?? []).map((n: any) => ({
          id: n.id,
          title: n.title,
          difficulty: n.difficulty,
          resourceType: n.resourceType ?? 'other',
        }));
        const edges: Edge[] = (apiData?.edges ?? []).map((e: any) => ({
          source: e.source,
          target: e.target,
        }));

        setData({ nodes, edges });
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
        setData({
          nodes: [
            {
              id: '1',
              title: '基礎教材',
              difficulty: 1,
              resourceType: 'video',
            },
            { id: '2', title: '中級教材', difficulty: 3, resourceType: 'book' },
            {
              id: '3',
              title: '応用教材A',
              difficulty: 4,
              resourceType: 'course',
            },
            {
              id: '4',
              title: '応用教材B',
              difficulty: 5,
              resourceType: 'project',
            },
          ],
          edges: [
            { source: '1', target: '2' },
            { source: '1', target: '3' },
            { source: '2', target: '4' },
            { source: '3', target: '4' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [slug]);

  // D3 グラフ描画
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // 既存クリア

    // 先にコンテナ
    const container = svg.append('g');

    // ズーム・パン
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 矢印マーカー
    svg
      .append('defs')
      .append('marker')
      .attr('id', `arrowhead-${slug}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .style('fill', '#6366f1');

    // フォース
    const simulation = d3
      .forceSimulation<Node>(data.nodes)
      .force(
        'link',
        d3
          .forceLink<Node, Edge>(data.edges)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // エッジ描画
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .attr('marker-end', `url(#arrowhead-${slug})`);

    // ノード描画
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // ノードの色を難易度に基づいて決定
    const getNodeColor = (difficulty?: number) => {
      if (!difficulty) return '#9ca3af';
      switch (difficulty) {
        case 1:
          return '#3b82f6'; // 青
        case 2:
          return '#10b981'; // 緑
        case 3:
          return '#8b5cf6'; // 紫
        case 4:
          return '#f59e0b'; // 黄
        case 5:
          return '#ef4444'; // 赤
        default:
          return '#6b7280';
      }
    };

    // ノード円描画
    node
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) => getNodeColor(d.difficulty))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        d3.select(this).transition().duration(100).attr('r', 25);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(100).attr('r', 20);
      });

    // ノードテキスト
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .text((d) =>
        d.title.length > 6 ? d.title.substring(0, 6) + '...' : d.title
      );

    // ツールチップ
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    node
      .on('mouseover', function (event, d) {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(
            `
          <div><strong>${d.title}</strong></div>
          <div>難易度: ${d.difficulty ? d.difficulty + '/5' : '未設定'}</div>
          <div>種類: ${d.resourceType}</div>
        `
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');
      })
      .on('mouseout', function () {
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // シミュレーション更新
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node).x!)
        .attr('y1', (d) => (d.source as Node).y!)
        .attr('x2', (d) => (d.target as Node).x!)
        .attr('y2', (d) => (d.target as Node).y!);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // ドラッグ関数
    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // クリーンアップ
    return () => {
      simulation.stop();
      svg.on('.zoom', null);
      svg.selectAll('*').remove();
      tooltip.remove();
    };
  }, [data, slug, width, height]);

  if (loading) {
    return (
      <div className="min-h-[600px] border rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">グラフを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg bg-white overflow-hidden relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minHeight: '600px' }}
        />

        {/* 凡例カード */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg text-xs border shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-2">難易度</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
              <span>レベル1 - 入門</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
              <span>レベル2 - 初級</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
              <span>レベル3 - 中級</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
              <span>レベル4 - 上級</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
              <span>レベル5 - 専門</span>
            </div>
          </div>
        </div>

        {/* 操作ガイド */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-gray-600 border shadow-sm">
          <div className="space-y-1">
            <div>🖱️ ドラッグ: ノード移動</div>
            <div>🔍 ホイール: ズーム</div>
            <div>✋ ドラッグ: パン</div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          学習順序が矢印で示されます。ノードをドラッグして配置を調整できます。
        </p>
      </div>
    </div>
  );
};

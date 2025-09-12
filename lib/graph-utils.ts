/**
 - トポソート
 - グラフ枝刈り
 - ナップサック
 */

export interface GraphNode {
  id: string; // ノード
  title: string; // 教材名
  difficulty?: number; // 難易度 1..5
  durationMin?: number; // 学習時間(分)
  costAmount?: number; // 費用(円)
  resourceType?: string; // 種類
}

export interface GraphEdge {
  source: string; // 依存元
  target: string; // 依存先
  weight?: number; // 学習頻度/人気などの重み(統計に利用)
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface LearningConstraints {
  maxDurationHours?: number; // 総学習時間(時間単位)の上限
  maxCostAmount?: number; // 予算上限
  maxDifficulty?: number; // 許容する平均難易度の上限
  requiredNodes?: string[]; // 必ず含めたいノード
  excludedNodes?: string[]; // 必ず除外したいノード
}

export interface LearningPath {
  nodes: GraphNode[]; // 選定された教材の順序リスト
  totalDuration: number; // 合計学習時間
  totalCost: number; // 合計費用
  averageDifficulty: number; // 平均難易度
  isValid: boolean; // 制約を満たしているか
  violatedConstraints: string[]; // どの制約に違反したか
}

/**
  - Kahn法トポロジカルソート
  - 依存(source→target)を満たす順序でノード並べる
  - サイクルがある場合は例外
 */
export function topologicalSort(graph: GraphData): GraphNode[] {
  const { nodes, edges } = graph;

  // 隣接リスト/入次数/ノード辞書を構築する
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const nodeMap = new Map<string, GraphNode>();

  // 初期化
  nodes.forEach((node) => {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
    nodeMap.set(node.id, node);
  });

  // エッジ反映
  edges.forEach((edge) => {
    const { source, target } = edge;
    if (adjList.has(source) && inDegree.has(target)) {
      adjList.get(source)!.push(target);
      inDegree.set(target, inDegree.get(target)! + 1);
    }
  });

  // 入次数0のノードから処理開始
  const queue: string[] = [];
  const result: GraphNode[] = [];

  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = nodeMap.get(current)!;
    result.push(currentNode);

    // currentから出ている辺を削除し、入次数が0になったらキュー
    const neighbors = adjList.get(current) || [];
    neighbors.forEach((neighbor) => {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    });
  }

  if (result.length !== nodes.length)
    throw new Error('Graph contains cycles - cannot create learning path');

  return result;
}

// グラフにサイクルがあるか判定
export function hasCycles(graph: GraphData): boolean {
  try {
    topologicalSort(graph);
    return false;
  } catch {
    return true;
  }
}

// 難易度/費用/時間の各しきい値で個別ノードを落とす
export function pruneGraph(
  graph: GraphData,
  constraints: LearningConstraints
): GraphData {
  const { nodes, edges } = graph;
  let filteredNodes = [...nodes];

  // 平均ではなく個別値でフィルタ
  if (constraints.maxDifficulty !== undefined) {
    filteredNodes = filteredNodes.filter(
      (node) =>
        !node.difficulty || node.difficulty <= constraints.maxDifficulty!
    );
  }

  // 予算フィルタ(個別コストが総予算の50%を超えるものは除外：大物1本で終わらないため)
  if (constraints.maxCostAmount !== undefined) {
    filteredNodes = filteredNodes.filter(
      (node) =>
        !node.costAmount || node.costAmount <= constraints.maxCostAmount! * 0.5
    );
  }

  // 時間フィルタ(個別時間が総時間の30%を超えるものは除外：偏り防止)
  if (constraints.maxDurationHours !== undefined) {
    const maxDurationMin = constraints.maxDurationHours * 60;
    filteredNodes = filteredNodes.filter(
      (node) => !node.durationMin || node.durationMin <= maxDurationMin * 0.3
    );
  }

  // 必須ノードは戻す(上のフィルタで落ちていても復活)
  if (constraints.requiredNodes && constraints.requiredNodes.length > 0) {
    constraints.requiredNodes.forEach((requiredId) => {
      if (!filteredNodes.some((n) => n.id === requiredId)) {
        const originalNode = nodes.find((n) => n.id === requiredId);
        if (originalNode) filteredNodes.push(originalNode);
      }
    });
  }

  // 除外ノードを除外
  if (constraints.excludedNodes && constraints.excludedNodes.length > 0) {
    const excludedSet = new Set(constraints.excludedNodes);
    filteredNodes = filteredNodes.filter((node) => !excludedSet.has(node.id));
  }

  // 残ったノードのみを参照するエッジに制限する
  const nodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}

// 制約をかけた上で、依存順の学習パス候補を返す
export function findLearningPaths(
  graph: GraphData,
  constraints: LearningConstraints
): LearningPath[] {
  // 枝刈り
  const prunedGraph = pruneGraph(graph, constraints);
  // トポ順を得る
  const sortedNodes = topologicalSort(prunedGraph);
  // ひとまず単一路線のパスを作る
  const path = createLearningPath(sortedNodes, constraints);
  return [path];
}

// トポ順のノード列から合計値・平均値・制約違反を計算
function createLearningPath(
  nodes: GraphNode[],
  constraints: LearningConstraints
): LearningPath {
  let totalDuration = 0;
  let totalCost = 0;
  let totalDifficulty = 0;
  let difficultyCount = 0;
  const violatedConstraints: string[] = [];

  // 合計値の集計
  nodes.forEach((node) => {
    totalDuration += node.durationMin || 0;
    totalCost += node.costAmount || 0;
    if (node.difficulty) {
      totalDifficulty += node.difficulty;
      difficultyCount++;
    }
  });

  const averageDifficulty =
    difficultyCount > 0 ? totalDifficulty / difficultyCount : 0;
  const totalDurationHours = totalDuration / 60;

  // 制約チェック
  if (
    constraints.maxDurationHours &&
    totalDurationHours > constraints.maxDurationHours
  ) {
    violatedConstraints.push(
      `Time exceeds limit: ${totalDurationHours.toFixed(1)}h > ${constraints.maxDurationHours}h`
    );
  }
  if (constraints.maxCostAmount && totalCost > constraints.maxCostAmount) {
    violatedConstraints.push(
      `Cost exceeds budget: ¥${totalCost.toLocaleString()} > ¥${constraints.maxCostAmount.toLocaleString()}`
    );
  }
  if (
    constraints.maxDifficulty &&
    averageDifficulty > constraints.maxDifficulty
  ) {
    violatedConstraints.push(
      `Difficulty too high: ${averageDifficulty.toFixed(1)} > ${constraints.maxDifficulty}`
    );
  }

  return {
    nodes,
    totalDuration,
    totalCost,
    averageDifficulty,
    isValid: violatedConstraints.length === 0,
    violatedConstraints,
  };
}

/**
  - ナップサック風の貪欲法で「価値/重み」比の高い教材から採用
  - 重み：時間
  - 依存の前提条件チェックは別途必要
 */
export function optimizeLearningPath(
  graph: GraphData,
  constraints: LearningConstraints
): LearningPath {
  const prunedGraph = pruneGraph(graph, constraints);
  const sortedNodes = topologicalSort(prunedGraph);

  // 時間/予算の制約がある場合のみ最適化
  if (constraints.maxDurationHours || constraints.maxCostAmount) {
    const optimizedNodes = knapsackOptimization(sortedNodes, constraints);
    return createLearningPath(optimizedNodes, constraints);
  }
  return createLearningPath(sortedNodes, constraints);
}

// 簡易ナップサック（貪欲）：value/weight 比で降順に採用
function knapsackOptimization(
  nodes: GraphNode[],
  constraints: LearningConstraints
): GraphNode[] {
  const maxDurationMin = (constraints.maxDurationHours || Infinity) * 60;
  const maxCost = constraints.maxCostAmount || Infinity;

  const scoredNodes = nodes.map((node) => {
    const duration = node.durationMin || 60; // 未設定は60分とする
    const cost = node.costAmount || 0;
    const difficulty = node.difficulty || 3; // 未設定は中程度とする

    const value = (6 - difficulty) * 10; // 易しいほど価値とする
    const normalizedCost = maxCost === Infinity ? 0 : (cost / maxCost) * 60;
    const weight = duration + normalizedCost;
    const ratio = weight > 0 ? value / weight : value;

    return { node, value, weight, ratio, duration, cost };
  });

  // 価値/重み比でソート（高い順）
  scoredNodes.sort((a, b) => b.ratio - a.ratio);

  // 制約内に収まるものを順に採用
  const selectedNodes: GraphNode[] = [];
  let totalDuration = 0;
  let totalCost = 0;

  for (const item of scoredNodes) {
    if (
      totalDuration + item.duration <= maxDurationMin &&
      totalCost + item.cost <= maxCost
    ) {
      selectedNodes.push(item.node);
      totalDuration += item.duration;
      totalCost += item.cost;
    }
  }

  return selectedNodes;
}

// 指定ノードの前提ノード群を取得
export function getPrerequisites(
  nodeId: string,
  graph: GraphData
): GraphNode[] {
  const prerequisites: GraphNode[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  graph.edges.forEach((edge) => {
    if (edge.target === nodeId && nodeMap.has(edge.source)) {
      prerequisites.push(nodeMap.get(edge.source)!);
    }
  });

  return prerequisites;
}

// 指定ノードを前提とする依存先ノード群を取得
export function getDependents(nodeId: string, graph: GraphData): GraphNode[] {
  const dependents: GraphNode[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  graph.edges.forEach((edge) => {
    if (edge.source === nodeId && nodeMap.has(edge.target)) {
      dependents.push(nodeMap.get(edge.target)!);
    }
  });

  return dependents;
}

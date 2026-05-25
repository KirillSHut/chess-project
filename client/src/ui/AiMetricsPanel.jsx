const EMPTY_VALUE = '-';

export function AiMetricsPanel({ metrics }) {
  const rows = [
    ['Difficulty', formatText(metrics?.difficulty)],
    ['Side', formatText(metrics?.side)],
    ['Selected move', formatMove(metrics?.selectedMove)],
    ['Calculation time', formatTime(metrics?.calculationTimeMs)],
    ['Search depth', formatMetric(metrics?.searchDepth)],
    ['Nodes visited', formatMetric(metrics?.nodesVisited)],
    ['Evaluations', formatMetric(metrics?.evaluations)],
    ['Pruned branches', formatMetric(metrics?.prunedBranches)],
  ];

  return (
    <aside className="ai-metrics-panel" aria-label="AI metrics">
      <p className="ai-metrics-title">AI Metrics</p>
      <dl className="ai-metrics-list">
        {rows.map(([label, value]) => (
          <div className="ai-metrics-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function formatText(value) {
  if (!value) return EMPTY_VALUE;

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function formatMove(move) {
  if (!move) return EMPTY_VALUE;

  return `${move.fromId} -> ${move.toId}`;
}

function formatTime(value) {
  if (typeof value !== 'number') return EMPTY_VALUE;

  return `${value.toFixed(2)} ms`;
}

function formatMetric(value) {
  return typeof value === 'number' ? value.toLocaleString() : EMPTY_VALUE;
}

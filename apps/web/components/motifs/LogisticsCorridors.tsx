interface CorridorNode {
  label: string;
  sub: string;
}
interface CorridorLeg {
  mode: string;
  note?: string;
}

/**
 * A schematic of ALTAN's multimodal corridor: origin → transit → port → market.
 * Rendered as a single responsive inline SVG (no raster assets, CSP-safe). Labels
 * are passed in so the diagram is fully localizable. Decorative + labelled, so it
 * carries a role/aria-label rather than leaving screen readers a blank graphic.
 */
export function LogisticsCorridors({
  nodes,
  legs,
  ariaLabel,
}: {
  nodes: CorridorNode[];
  legs: CorridorLeg[];
  ariaLabel: string;
}) {
  const W = 1000;
  const H = 280;
  const y = 150;
  const xs = nodes.map((_, i) => 70 + (i * (W - 140)) / Math.max(1, nodes.length - 1));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      className="h-auto w-full"
      style={{ fontFamily: 'var(--font-mono), monospace' }}
    >
      {/* Baseline route */}
      <line x1={xs[0]} y1={y} x2={xs[xs.length - 1]} y2={y} stroke="#232A34" strokeWidth={2} />

      {legs.map((leg, i) => {
        const x1 = xs[i]!;
        const x2 = xs[i + 1]!;
        const mid = (x1 + x2) / 2;
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="#C8881C"
              strokeWidth={2}
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
            {/* Directional chevron */}
            <path
              d={`M ${x2 - 14} ${y - 5} L ${x2 - 6} ${y} L ${x2 - 14} ${y + 5}`}
              fill="none"
              stroke="#E9A227"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={mid}
              y={y - 24}
              textAnchor="middle"
              fill="#E9A227"
              fontSize={13}
              letterSpacing="2"
            >
              {leg.mode.toUpperCase()}
            </text>
            {leg.note && (
              <text x={mid} y={y + 34} textAnchor="middle" fill="#5E6876" fontSize={11}>
                {leg.note}
              </text>
            )}
          </g>
        );
      })}

      {nodes.map((node, i) => (
        <g key={node.label}>
          <circle cx={xs[i]} cy={y} r={9} fill="#0C0F14" stroke="#E9A227" strokeWidth={2} />
          <circle cx={xs[i]} cy={y} r={3} fill="#E9A227" />
          <text
            x={xs[i]}
            y={y - 52}
            textAnchor="middle"
            fill="#F5F6F8"
            fontSize={15}
            fontWeight={600}
            style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          >
            {node.label}
          </text>
          <text x={xs[i]} y={y + 66} textAnchor="middle" fill="#8C96A4" fontSize={12}>
            {node.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}

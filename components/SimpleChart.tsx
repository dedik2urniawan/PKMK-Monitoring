import React from "react";

type Point = { x: number; y: number };

type Series = {
  name: string;
  color: string;
  points: Point[];
  dashed?: boolean;
  showPoints?: boolean;
  legend?: boolean;
};

type Props = {
  width?: number;
  height?: number;
  yLabel?: string;
  xLabel?: string;
  series: Series[];
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
};

export default function SimpleChart({
  width = 640,
  height = 240,
  yLabel,
  xLabel,
  series,
  padding = { top: 16, right: 16, bottom: 28, left: 36 },
}: Props) {
  const allPoints = series.flatMap((s) => s.points);
  let minX = Math.min(...allPoints.map((p) => p.x));
  let maxX = Math.max(...allPoints.map((p) => p.x));
  let minY = Math.min(...allPoints.map((p) => p.y));
  let maxY = Math.max(...allPoints.map((p) => p.y));
  if (!isFinite(minX) || !isFinite(maxX)) { minX = 0; maxX = 1; }
  if (!isFinite(minY) || !isFinite(maxY)) { minY = 0; maxY = 1; }
  // Expand domain if single value so ticks/points show sensibly
  if (minX === maxX) { minX = minX - 1; maxX = maxX + 1; }
  if (minY === maxY) { minY = minY - 1; maxY = maxY + 1; }

  const W = width - (padding.left ?? 0) - (padding.right ?? 0);
  const H = height - (padding.top ?? 0) - (padding.bottom ?? 0);

  function sx(x: number) {
    return (padding.left ?? 0) + ((x - minX) / (maxX - minX)) * W;
  }
  function sy(y: number) {
    return (padding.top ?? 0) + (1 - (y - minY) / (maxY - minY)) * H;
  }

  const xTicks = 5;
  const yTicks = 5;

  const grid: React.ReactNode[] = [];
  for (let i = 0; i <= xTicks; i++) {
    const t = i / xTicks;
    const x = (padding.left ?? 0) + t * W;
    const val = (minX + t * (maxX - minX)).toFixed(0);
    grid.push(
      <g key={`gx-${i}`}>
        <line x1={x} y1={padding.top} x2={x} y2={padding.top! + H} stroke="#e5e7eb" />
        <text x={x} y={(padding.top ?? 0) + H + 14} textAnchor="middle" fontSize="10" fill="#6b7280">
          {val}
        </text>
      </g>
    );
  }
  for (let i = 0; i <= yTicks; i++) {
    const t = i / yTicks;
    const y = (padding.top ?? 0) + t * H;
    const val = (maxY - t * (maxY - minY)).toFixed(1);
    grid.push(
      <g key={`gy-${i}`}>
        <line x1={padding.left} y1={y} x2={padding.left! + W} y2={y} stroke="#e5e7eb" />
        <text x={(padding.left ?? 0) - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#6b7280">
          {val}
        </text>
      </g>
    );
  }

  function pathFor(points: Point[]) {
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`)
      .join(" ");
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {/* Grid + axes */}
      {grid}
      {/* Series */}
      {series.map((s) => (
        <g key={s.name}>
          <path
            d={pathFor(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.dashed ? 1.2 : 2}
            strokeDasharray={s.dashed ? "4 3" : undefined}
          />
          {(s.showPoints ?? true) && s.points.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.2} fill={s.color} />
          ))}
        </g>
      ))}
      {/* Legend */}
      <g transform={`translate(${(padding.left ?? 0) + 8}, ${(padding.top ?? 0) + 8})`}>
        {series.filter(s=>s.legend).slice(0, 8).map((s, i) => (
          <g key={s.name} transform={`translate(${i * 120}, 0)`}>
            <line x1={0} y1={0} x2={18} y2={0} stroke={s.color} strokeWidth={s.dashed ? 1.2 : 2} strokeDasharray={s.dashed ? "4 3" : undefined} />
            <text x={22} y={3} fontSize="10" fill="#374151">{s.name}</text>
          </g>
        ))}
      </g>
      {/* Labels */}
      {yLabel && (
        <text x={12} y={(padding.top ?? 0) - 4} fontSize="10" fill="#6b7280">{yLabel}</text>
      )}
      {xLabel && (
        <text x={(padding.left ?? 0) + W} y={height - 4} textAnchor="end" fontSize="10" fill="#6b7280">{xLabel}</text>
      )}
    </svg>
  );
}

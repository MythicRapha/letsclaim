'use client'

import { useState, useRef, useMemo } from 'react'

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTimeLabel(bucket: string): string {
  // bucket like "2026-03-12T14:00" or "2026-03-12T14:30"
  const d = new Date(bucket)
  if (isNaN(d.getTime())) return bucket
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** Fill in missing dates with value=0 so chart always shows full 30-day range */
function padDaily(data: Array<{ date: string; value: number }>): Array<{ date: string; value: number }> {
  const now = new Date()
  const map = new Map(data.map(d => [d.date, d.value]))
  const result: Array<{ date: string; value: number }> = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, value: map.get(key) ?? 0 })
  }
  return result
}

/** Fill in 15-min interval buckets for last 6 hours (24 buckets) — uses UTC to match server */
function pad15min(data: Array<{ date: string; value: number }>): Array<{ date: string; value: number }> {
  const now = new Date()
  // Round down to nearest 15-min block in UTC
  now.setUTCMinutes(Math.floor(now.getUTCMinutes() / 15) * 15, 0, 0)
  const map = new Map(data.map(d => [d.date, d.value]))
  const result: Array<{ date: string; value: number }> = []

  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 15 * 60 * 1000)
    const key = d.getUTCFullYear() + '-' +
      String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0') + 'T' +
      String(d.getUTCHours()).padStart(2, '0') + ':' +
      String(d.getUTCMinutes()).padStart(2, '0')
    result.push({ date: key, value: map.get(key) ?? 0 })
  }
  return result
}

interface AreaChartProps {
  data: Array<{ date: string; value: number }>
  id?: string
  padMode?: 'daily' | '15min' | 'none'
  cumulative?: boolean
  formatValue?: (v: number) => string
  formatGridLabel?: (v: number) => string
  tooltipSuffix?: string
  tooltipColor?: string
  tooltipExtra?: (index: number) => { label: string; color: string } | null
}

export default function AreaChart({
  data,
  id = 'chart',
  padMode = 'daily',
  cumulative = false,
  formatValue,
  formatGridLabel,
  tooltipSuffix = 'SOL',
  tooltipColor = '#14F195',
  tooltipExtra,
}: AreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const defaultFormatValue = (v: number) => v < 0.01 ? v.toFixed(4) : v < 1 ? v.toFixed(3) : v.toFixed(2)
  const fmtVal = formatValue ?? defaultFormatValue

  const defaultFormatGrid = (v: number) => v < 0.01 ? v.toFixed(4) : v < 1 ? v.toFixed(3) : v.toFixed(2)
  const fmtGrid = formatGridLabel ?? defaultFormatGrid

  const isTimeMode = padMode === '15min'
  const fmtLabel = isTimeMode ? formatTimeLabel : formatDateLabel

  const paddedData = useMemo(() => {
    if (data.length === 0) return []
    let result: Array<{ date: string; value: number }>
    if (padMode === '15min') result = pad15min(data)
    else if (padMode === 'daily') result = padDaily(data)
    else result = data

    if (cumulative) {
      let sum = 0
      result = result.map(d => ({ date: d.date, value: sum += d.value }))
    }
    return result
  }, [data, padMode, cumulative])

  const chartConfig = useMemo(() => {
    const width = 800
    const height = 280
    const padding = { top: 20, right: 20, bottom: 40, left: 55 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    if (paddedData.length === 0) {
      return { width, height, padding, chartWidth, chartHeight, points: [], path: '', areaPath: '', maxVal: 0, gridLines: [] }
    }

    const values = paddedData.map(d => d.value)
    const maxVal = Math.max(...values, 0.001) * 1.15

    const points = paddedData.map((d, i) => ({
      x: padding.left + (paddedData.length === 1 ? chartWidth / 2 : (i / (paddedData.length - 1)) * chartWidth),
      y: padding.top + chartHeight - (d.value / maxVal) * chartHeight,
      date: d.date,
      value: d.value,
    }))

    let path = ''
    let areaPath = ''

    if (points.length === 1) {
      const p = points[0]
      path = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`
      areaPath = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${padding.top + chartHeight} L ${p.x - 20} ${padding.top + chartHeight} Z`
    } else {
      path = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const cpx = (prev.x + curr.x) / 2
        path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
      }
      const bottom = padding.top + chartHeight
      areaPath = path + ` L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`
    }

    const gridCount = 4
    const gridLines = Array.from({ length: gridCount }, (_, i) => {
      const val = (maxVal / gridCount) * (i + 1)
      const y = padding.top + chartHeight - (val / maxVal) * chartHeight
      return { y, label: fmtGrid(val) }
    })

    return { width, height, padding, chartWidth, chartHeight, points, path, areaPath, maxVal, gridLines }
  }, [paddedData, fmtGrid])

  const dateLabels = useMemo(() => {
    if (paddedData.length <= 1) return paddedData.map((d, i) => ({ index: i, label: fmtLabel(d.date) }))
    const labelCount = isTimeMode ? 8 : 6
    const step = Math.max(1, Math.floor(paddedData.length / labelCount))
    const labels: Array<{ index: number; label: string }> = []
    for (let i = 0; i < paddedData.length; i += step) {
      labels.push({ index: i, label: fmtLabel(paddedData[i].date) })
    }
    if (labels[labels.length - 1].index !== paddedData.length - 1) {
      labels.push({ index: paddedData.length - 1, label: fmtLabel(paddedData[paddedData.length - 1].date) })
    }
    return labels
  }, [paddedData, fmtLabel, isTimeMode])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || chartConfig.points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartConfig.width

    let closest = 0
    let minDist = Infinity
    for (let i = 0; i < chartConfig.points.length; i++) {
      const dist = Math.abs(chartConfig.points[i].x - mouseX)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    }
    setHoveredIndex(closest)
  }

  const hoveredPoint = hoveredIndex !== null ? chartConfig.points[hoveredIndex] : null
  const extra = hoveredIndex !== null && tooltipExtra ? tooltipExtra(hoveredIndex) : null

  const areaGradId = `${id}-areaGrad`
  const lineGradId = `${id}-lineGrad`
  const glowId = `${id}-glow`

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9945FF" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#14F195" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#14F195" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9945FF" />
            <stop offset="100%" stopColor="#14F195" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {chartConfig.gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={chartConfig.padding.left}
              y1={line.y}
              x2={chartConfig.padding.left + chartConfig.chartWidth}
              y2={line.y}
              stroke="white"
              strokeOpacity="0.04"
              strokeWidth="1"
            />
            <text
              x={chartConfig.padding.left - 8}
              y={line.y + 3}
              textAnchor="end"
              className="font-mono"
              fill="#404050"
              fontSize="9"
            >
              {line.label}
            </text>
          </g>
        ))}

        <line
          x1={chartConfig.padding.left}
          y1={chartConfig.padding.top + chartConfig.chartHeight}
          x2={chartConfig.padding.left + chartConfig.chartWidth}
          y2={chartConfig.padding.top + chartConfig.chartHeight}
          stroke="white"
          strokeOpacity="0.06"
          strokeWidth="1"
        />

        {dateLabels.map(({ index, label }) => {
          const point = chartConfig.points[index]
          if (!point) return null
          return (
            <text
              key={index}
              x={point.x}
              y={chartConfig.padding.top + chartConfig.chartHeight + 20}
              textAnchor="middle"
              className="font-mono"
              fill="#404050"
              fontSize="9"
            >
              {label}
            </text>
          )
        })}

        <text
          x={chartConfig.padding.left - 8}
          y={chartConfig.padding.top + chartConfig.chartHeight + 3}
          textAnchor="end"
          className="font-mono"
          fill="#404050"
          fontSize="9"
        >
          0
        </text>

        {chartConfig.areaPath && (
          <path d={chartConfig.areaPath} fill={`url(#${areaGradId})`} />
        )}

        {chartConfig.path && (
          <path
            d={chartConfig.path}
            fill="none"
            stroke={`url(#${lineGradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        )}

        {chartConfig.points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === i ? 5 : 3}
            fill={hoveredIndex === i ? '#14F195' : '#9945FF'}
            stroke={hoveredIndex === i ? '#14F195' : 'transparent'}
            strokeWidth="2"
            strokeOpacity="0.4"
            style={{ transition: 'r 0.15s ease, fill 0.15s ease' }}
          />
        ))}

        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={chartConfig.padding.top}
            x2={hoveredPoint.x}
            y2={chartConfig.padding.top + chartConfig.chartHeight}
            stroke="#14F195"
            strokeOpacity="0.15"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}
      </svg>

      {hoveredPoint && (
        <div
          className="absolute pointer-events-none bg-[#0A0A12]/90 border border-white/[0.08] px-3 py-2 backdrop-blur-sm"
          style={{
            left: `${(hoveredPoint.x / chartConfig.width) * 100}%`,
            top: `${(hoveredPoint.y / chartConfig.height) * 100 - 14}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-mono text-[0.55rem] text-[#686878]">
            {isTimeMode ? formatTimeLabel(hoveredPoint.date) : hoveredPoint.date}
          </div>
          <div className="font-mono text-sm font-bold" style={{ color: tooltipColor }}>
            {fmtVal(hoveredPoint.value)} {tooltipSuffix}
          </div>
          {extra && (
            <div className="font-mono text-[0.55rem]" style={{ color: extra.color }}>
              {extra.label}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

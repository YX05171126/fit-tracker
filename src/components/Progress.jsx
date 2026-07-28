import React, { useState, useMemo } from 'react'
import { calculateBMI } from '../utils/tdee'

/**
 * 简易 SVG 折线图
 */
function SimpleLineChart({ data, width = 320, height = 180, color = '#4CAF50', label = '', unit = '' }) {
  if (!data || data.length < 2) {
    return <div className="chart-empty">数据不足，至少需要2条记录才能生成图表</div>
  }
  const padding = { top: 20, right: 16, bottom: 30, left: 40 }
  const w = width - padding.left - padding.right
  const h = height - padding.top - padding.bottom

  const vals = data.map(d => d.value)
  const min = Math.min(...vals) * 0.95
  const max = Math.max(...vals) * 1.05
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * w
    const y = padding.top + h - ((d.value - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  // Y轴标签
  const yTicks = 4
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const val = min + (range / (yTicks - 1)) * (yTicks - 1 - i)
    return { y: padding.top + (h / (yTicks - 1)) * i, val: Math.round(val) }
  })

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Y轴网格 & 标签 */}
      {yLabels.map((t, i) => (
        <g key={i}>
          <line x1={padding.left} y1={t.y} x2={padding.left + w} y2={t.y}
            stroke="#e8e8e8" strokeWidth="1" strokeDasharray="4,4" />
          <text x={padding.left - 6} y={t.y + 4} textAnchor="end"
            fill="#9E9E9E" fontSize="10">{t.val}</text>
        </g>
      ))}

      {/* X轴标签 */}
      {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d, _, arr) => {
        const idx = data.indexOf(d)
        const x = padding.left + (idx / (data.length - 1)) * w
        return (
          <text key={idx} x={x} y={height - 6} textAnchor="middle"
            fill="#9E9E9E" fontSize="9">{d.label.slice(5)}</text>
        )
      })}

      {/* 折线 */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* 数据点 */}
      {data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * w
        const y = padding.top + h - ((d.value - min) / range) * h
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
            <title>{d.label}: {d.value}{unit}</title>
          </g>
        )
      })}
    </svg>
  )
}

export default function Progress({ weightLogs, foodLogs, tdeeData, addWeight, addMeasurements, measureLogs, profile }) {
  const [weightInput, setWeightInput] = useState('')
  const [measureInput, setMeasureInput] = useState({ waist: '', hip: '', arm: '', thigh: '' })

  // 体重图表数据
  const sortedWeights = useMemo(() =>
    [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)).map(w => ({
      label: w.date,
      value: w.weight,
    })),
    [weightLogs]
  )

  // 热量摄入图表数据（最近14天）
  const calorieData = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const log = foodLogs[key]
      let kcal = 0
      if (log) {
        Object.values(log.meals).forEach(items => {
          items.forEach(f => { kcal += f.kcal || 0 })
        })
      }
      days.push({ label: key, value: kcal })
    }
    return days
  }, [foodLogs])

  const bmi = useMemo(() => calculateBMI(profile.weightKg, profile.heightCm), [profile])

  const latestMeasure = useMemo(() => {
    if (measureLogs.length === 0) return null
    return [...measureLogs].sort((a, b) => b.date.localeCompare(a.date))[0]
  }, [measureLogs])

  const handleAddWeight = () => {
    const w = parseFloat(weightInput)
    if (w > 20 && w < 300) {
      addWeight(w)
      setWeightInput('')
    }
  }

  const handleAddMeasures = () => {
    const data = {}
    if (measureInput.waist) data.waist = parseFloat(measureInput.waist)
    if (measureInput.hip) data.hip = parseFloat(measureInput.hip)
    if (measureInput.arm) data.arm = parseFloat(measureInput.arm)
    if (measureInput.thigh) data.thigh = parseFloat(measureInput.thigh)
    if (Object.keys(data).length > 0) {
      addMeasurements(data)
      setMeasureInput({ waist: '', hip: '', arm: '', thigh: '' })
    }
  }

  return (
    <div>
      {/* ── 体重趋势 ── */}
      <div className="card">
        <div className="card-title">⚖️ 体重趋势</div>
        <div className="stat-grid mb-12">
          <div className="stat-item">
            <div className="stat-value">{profile.weightKg} kg</div>
            <div className="stat-label">当前体重</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: bmi.color }}>{bmi.value}</div>
            <div className="stat-label">BMI · {bmi.label}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {sortedWeights.length >= 2
                ? (sortedWeights[sortedWeights.length-1].value - sortedWeights[0].value).toFixed(1)
                : '--'} kg
            </div>
            <div className="stat-label">总变化</div>
          </div>
        </div>

        {sortedWeights.length >= 2 ? (
          <SimpleLineChart data={sortedWeights} width={320} height={180} color="#4CAF50" unit="kg" />
        ) : (
          <div className="chart-empty">记录体重数据后会显示趋势图</div>
        )}

        <div className="weight-input-row">
          <input
            className="form-input"
            type="number"
            step="0.1"
            placeholder="输入今日体重 (kg)"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddWeight()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddWeight}>记录</button>
        </div>
      </div>

      {/* ── 围度记录 ── */}
      <div className="card">
        <div className="card-title">📏 身体围度</div>
        {latestMeasure && (
          <div className="stat-grid mb-12">
            {latestMeasure.waist && <div className="stat-item"><div className="stat-value">{latestMeasure.waist}</div><div className="stat-label">腰围 cm</div></div>}
            {latestMeasure.hip && <div className="stat-item"><div className="stat-value">{latestMeasure.hip}</div><div className="stat-label">臀围 cm</div></div>}
            {latestMeasure.arm && <div className="stat-item"><div className="stat-value">{latestMeasure.arm}</div><div className="stat-label">臂围 cm</div></div>}
            {latestMeasure.thigh && <div className="stat-item"><div className="stat-value">{latestMeasure.thigh}</div><div className="stat-label">大腿围 cm</div></div>}
          </div>
        )}
        <div className="measure-grid">
          {['waist', 'hip', 'arm', 'thigh'].map(key => (
            <input key={key}
              className="form-input"
              type="number"
              step="0.1"
              placeholder={{ waist: '腰围', hip: '臀围', arm: '臂围', thigh: '大腿围' }[key] + ' (cm)'}
              value={measureInput[key]}
              onChange={e => setMeasureInput(p => ({ ...p, [key]: e.target.value }))}
            />
          ))}
        </div>
        <button className="btn btn-outline btn-sm btn-block mt-8" onClick={handleAddMeasures}>
          记录围度
        </button>
      </div>

      {/* ── 热量摄入趋势 ── */}
      <div className="card">
        <div className="card-title">🔥 热量摄入趋势（14天）</div>
        {calorieData.some(d => d.value > 0) ? (
          <div>
            <SimpleLineChart data={calorieData} width={320} height={180} color="#FF9800" unit="kcal" />
            {/* 目标线 */}
            <p className="text-hint text-center">橙色线: 每日摄入 · 目标: {tdeeData.targetCalories} kcal（虚线参考）</p>
          </div>
        ) : (
          <div className="chart-empty">记录饮食数据后会显示趋势图</div>
        )}
      </div>
    </div>
  )
}

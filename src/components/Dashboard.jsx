import React, { useMemo, useState, useEffect } from 'react'
import { estimateFatLoss, calculateBMI } from '../utils/tdee'

const MEAL_LABELS = { breakfast: '🥐 早餐', lunch: '🍱 午餐', dinner: '🍲 晚餐', snack: '🍪 加餐' }

const FASTING_PROTOCOLS = [
  { key: '16:8', label: '16:8', fastH: 16, eatH: 8, desc: '每天禁食16小时，进食窗口8小时' },
  { key: '18:6', label: '18:6', fastH: 18, eatH: 6, desc: '进阶断食，更适合有经验者' },
  { key: '20:4', label: '20:4', fastH: 20, eatH: 4, desc: '战士饮食法，一日一餐或两小餐' },
  { key: '14:10', label: '14:10', fastH: 14, eatH: 10, desc: '入门版断食，适合新手' },
]

const WATER_PRESETS = [
  { ml: 200, label: '200ml', icon: '🥛' },
  { ml: 300, label: '300ml', icon: '☕' },
  { ml: 500, label: '500ml', icon: '🫗' },
]

export default function Dashboard({
  tdeeData, macros, todayTotals, todayLog, profile,
  exerciseKcalToday = 0,
  todayWater = 0, waterGoal = 2000, onAddWater, onResetWater,
  fastingConfig, onSetFastingConfig,
}) {
  const netKcal = todayTotals.kcal - exerciseKcalToday
  const effectiveBudget = tdeeData.targetCalories + exerciseKcalToday
  const remaining = effectiveBudget - todayTotals.kcal
  const pct = effectiveBudget > 0 ? Math.min(100, Math.round(todayTotals.kcal / effectiveBudget * 100)) : 0

  const radius = 68
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const ringColor = remaining >= 0 ? '#4CAF50' : '#F44336'

  const fatLoss = useMemo(() => estimateFatLoss(tdeeData.deficitKcal), [tdeeData])
  const bmi = useMemo(() => calculateBMI(profile.weightKg, profile.heightCm), [profile])

  const mealSummaries = Object.entries(todayLog.meals).map(([key, items]) => ({
    key, label: MEAL_LABELS[key],
    kcal: items.reduce((sum, f) => sum + (f.kcal || 0), 0),
    count: items.length,
  }))

  // ─── 饮水数据 ───
  const waterPct = Math.min(100, Math.round(todayWater / waterGoal * 100))
  const waterGlasses = Math.round(todayWater / 250 * 10) / 10
  const waterRemaining = Math.max(0, waterGoal - todayWater)

  // ─── 断食计时器 ───
  const [fastingSetup, setFastingSetup] = useState(false)

  return (
    <div>
      {/* ── 热量环形图 ── */}
      <div className="card">
        <div className="ring-container">
          <div className="ring-wrapper">
            <svg className="ring-svg" width="160" height="160" viewBox="0 0 160 160">
              <circle className="ring-bg" cx="80" cy="80" r={radius} />
              <circle className="ring-fg" cx="80" cy="80" r={radius}
                stroke={ringColor} strokeDasharray={circumference} strokeDashoffset={offset} />
            </svg>
            <div className="ring-center">
              <span className="ring-value">{remaining >= 0 ? remaining : Math.abs(remaining)}</span>
              <span className="ring-label">{remaining >= 0 ? '剩余 kcal' : '超出 kcal'}</span>
              <span className="ring-remaining" style={{ color: ringColor }}>{pct}% 已摄入</span>
            </div>
          </div>
        </div>
        <div className="stat-grid mt-12" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-item"><div className="stat-value">{tdeeData.targetCalories}</div><div className="stat-label">目标</div></div>
          <div className="stat-item"><div className="stat-value">{todayTotals.kcal}</div><div className="stat-label">摄入</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: exerciseKcalToday > 0 ? 'var(--warning)' : undefined }}>{exerciseKcalToday}</div><div className="stat-label">运动消耗</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: netKcal <= tdeeData.targetCalories ? 'var(--primary-dark)' : 'var(--danger)' }}>{netKcal}</div><div className="stat-label">净摄入</div></div>
        </div>
      </div>

      {/* ── 饮水追踪 ── */}
      <div className="card">
        <div className="card-title">💧 饮水追踪</div>
        <div className="water-visual">
          <div className="water-progress-bar">
            <div className="water-progress-fill" style={{ width: `${waterPct}%` }} />
          </div>
          <div className="water-stats">
            <span className="water-amount">{todayWater} ml</span>
            <span className="water-goal">/ {waterGoal} ml</span>
            <span className="water-glasses">（约 {waterGlasses} 杯）</span>
          </div>
        </div>
        {waterRemaining > 0 && (
          <p className="text-hint text-center" style={{ marginTop: 4 }}>
            还需 {waterRemaining} ml 达标
          </p>
        )}
        {waterPct >= 100 && (
          <p className="text-success text-center" style={{ marginTop: 4, fontWeight: 600 }}>🎉 今日饮水达标！</p>
        )}
        <div className="water-buttons mt-8">
          {WATER_PRESETS.map(p => (
            <button key={p.ml} className="water-btn" onClick={() => onAddWater(p.ml)}>
              <span className="water-btn-icon">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm btn-block mt-8" onClick={onResetWater} style={{ fontSize: 11 }}>
          重置今日饮水
        </button>
      </div>

      {/* ── 轻断食计时器 ── */}
      {!fastingConfig ? (
        <div className="card">
          <div className="card-title">⏱️ 轻断食计时器</div>
          {!fastingSetup ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <p className="text-hint" style={{ marginBottom: 10 }}>
                轻断食是减脂的有效辅助手段。设置进食窗口后，APP 会帮你计时。
              </p>
              <button className="btn btn-outline btn-sm" onClick={() => setFastingSetup(true)}>
                设置断食计划
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>选择断食方案</p>
              <div className="fasting-options">
                {FASTING_PROTOCOLS.map(p => (
                  <div key={p.key} className="fasting-option"
                    onClick={() => { onSetFastingConfig({ protocol: p.key, fastH: p.fastH, eatH: p.eatH, eatingStart: '12:00' }); setFastingSetup(false); }}
                  >
                    <div className="fasting-option-header">
                      <span className="fasting-option-label">{p.label}</span>
                      <span className="text-hint">禁食{p.fastH}h · 进食{p.eatH}h</span>
                    </div>
                    <div className="fasting-option-desc">{p.desc}</div>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <label className="form-label">进食窗口开始时间</label>
                  <input className="form-input" type="time" defaultValue="12:00"
                    style={{ width: '100%', marginTop: 4 }}
                    id="fastingStartInput"
                  />
                  <button className="btn btn-primary btn-sm btn-block mt-8" onClick={() => {
                    const timeEl = document.getElementById('fastingStartInput')
                    const startTime = timeEl ? timeEl.value : '12:00'
                    const sel = document.querySelector('.fasting-option.selected') || FASTING_PROTOCOLS[0]
                    // default to 16:8
                    onSetFastingConfig({ protocol: '16:8', fastH: 16, eatH: 8, eatingStart: startTime })
                    setFastingSetup(false)
                  }}>确认</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <FastingTimerCard config={fastingConfig} onReset={() => onSetFastingConfig(null)} />
      )}

      {/* ── 三大营养素 ── */}
      <div className="card">
        <div className="card-title">📊 宏量营养素</div>
        <div className="macro-list">
          {[
            { key: 'protein', emoji: '🥩', name: '蛋白质', target: macros.protein.grams, current: todayTotals.protein, unit: 'g', color: '#F44336' },
            { key: 'fat',     emoji: '🥑', name: '脂肪',   target: macros.fat.grams,     current: todayTotals.fat,     unit: 'g', color: '#FF9800' },
            { key: 'carbs',   emoji: '🍚', name: '碳水',   target: macros.carbs.grams,   current: todayTotals.carbs,   unit: 'g', color: '#2196F3' },
          ].map(m => {
            const pctDone = m.target > 0 ? Math.min(100, Math.round(m.current / m.target * 100)) : 0
            return (
              <div key={m.key} className="macro-item">
                <span className="macro-emoji">{m.emoji}</span>
                <div className="macro-info">
                  <div className="macro-header">
                    <span className="macro-name">{m.name}</span>
                    <span className="macro-value"><strong>{m.current}</strong> / {m.target} {m.unit}</span>
                  </div>
                  <div className="macro-bar-bg">
                    <div className="macro-bar-fg" style={{ width: `${pctDone}%`, backgroundColor: pctDone > 100 ? '#F44336' : m.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 今日饮食概览 ── */}
      <div className="card">
        <div className="card-title">📋 今日饮食</div>
        {mealSummaries.every(m => m.count === 0) ? (
          <p className="text-hint text-center" style={{ padding: '16px 0' }}>
            还没有记录，去「记录」页面添加食物吧 🍽️
          </p>
        ) : (
          mealSummaries.map(m => m.count > 0 && (
            <div key={m.key} className="meal-section" style={{ marginBottom: 8 }}>
              <div className="meal-header"><h3>{m.label}</h3><span className="meal-kcal">{m.kcal} kcal · {m.count}项</span></div>
            </div>
          ))
        )}
      </div>

      {/* ── 减重预估 ── */}
      <div className="card">
        <div className="card-title">🎯 减重预估</div>
        <div className="stat-grid">
          <div className="stat-item"><div className="stat-value">{fatLoss.perWeekKg} kg</div><div className="stat-label">每周减重</div></div>
          <div className="stat-item"><div className="stat-value">{fatLoss.perMonthKg} kg</div><div className="stat-label">每月减重</div></div>
          <div className="stat-item"><div className="stat-value" style={{ color: bmi.color }}>{bmi.value}</div><div className="stat-label">BMI · {bmi.label}</div></div>
        </div>
        <p className="text-hint mt-8">基于 {tdeeData.formulaLabel} 公式，{tdeeData.deficitPercent}% 热量缺口</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// 断食计时器卡片
// ═══════════════════════════════════════════
function FastingTimerCard({ config, onReset }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000) // 每30秒刷新
    return () => clearInterval(t)
  }, [])

  const eatingStart = config.eatingStart || '12:00'
  const [startH, startM] = eatingStart.split(':').map(Number)
  const eatingStartMin = startH * 60 + startM
  const eatingEndMin = eatingStartMin + (config.eatH || 8) * 60

  const currentMin = now.getHours() * 60 + now.getMinutes()

  // 判断状态
  let inEatingWindow = false
  if (eatingEndMin > 1440) {
    // 跨午夜
    inEatingWindow = currentMin >= eatingStartMin || currentMin < (eatingEndMin - 1440)
  } else {
    inEatingWindow = currentMin >= eatingStartMin && currentMin < eatingEndMin
  }

  const timeLeftMin = inEatingWindow
    ? eatingEndMin - currentMin + (eatingEndMin < currentMin ? 0 : 0) // time left in eating window
    : (eatingStartMin - currentMin + (currentMin > eatingStartMin ? 1440 : 0)) // time until next eating window

  // Need to handle the wrap-around case properly
  let displayMin
  if (inEatingWindow) {
    if (eatingEndMin > 1440) {
      displayMin = (eatingEndMin - 1440) - currentMin
      if (displayMin < 0) displayMin += 1440
    } else {
      displayMin = eatingEndMin - currentMin
    }
  } else {
    displayMin = eatingStartMin - currentMin
    if (displayMin < 0) displayMin += 1440
  }

  const hoursLeft = Math.floor(displayMin / 60)
  const minsLeft = displayMin % 60

  // 进度百分比
  const totalWindowMin = config.eatH * 60
  let progressPct = 50
  if (inEatingWindow) {
    const elapsedEatingMin = eatingStartMin > 1440 ? 0 : Math.max(0, currentMin - eatingStartMin)
    progressPct = Math.min(100, Math.round(elapsedEatingMin / totalWindowMin * 100))
  }

  return (
    <div className="card">
      <div className="card-title">
        ⏱️ 轻断食 · {config.protocol}
        <button className="btn btn-sm" style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 10 }}
          onClick={onReset}>✕</button>
      </div>

      <div className="fasting-status" style={{
        background: inEatingWindow ? '#E8F5E9' : '#FFF3E0',
        borderLeft: `4px solid ${inEatingWindow ? '#4CAF50' : '#FF9800'}`,
      }}>
        <div className="fasting-status-icon">{inEatingWindow ? '🍽️' : '⏳'}</div>
        <div className="fasting-status-text">
          <div className="fasting-status-label" style={{ color: inEatingWindow ? '#4CAF50' : '#FF9800' }}>
            {inEatingWindow ? '进食窗口' : '断食中'}
          </div>
          <div className="fasting-status-timer">
            {inEatingWindow
              ? `${hoursLeft}小时${minsLeft}分钟后关闭进食窗口`
              : `${hoursLeft}小时${minsLeft}分钟后可以进食`
            }
          </div>
        </div>
      </div>

      {/* 时间轴可视化 */}
      <div className="fasting-timeline mt-8">
        <div className="fasting-timeline-bar">
          <div className="fasting-timeline-fast" style={{ width: `${config.fastH / 24 * 100}%` }} />
          <div className="fasting-timeline-eat" style={{ width: `${config.eatH / 24 * 100}%` }} />
        </div>
        <div className="fasting-timeline-labels">
          <span>禁食 {config.fastH}h</span>
          <span>进食 {config.eatH}h</span>
        </div>
      </div>

      <div className="fasting-info mt-8">
        <span className="text-hint">进食窗口：{eatingStart} – {
          (() => {
            const endMin = eatingStartMin + config.eatH * 60
            const h = Math.floor((endMin % 1440) / 60)
            const m = endMin % 60
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
          })()
        }</span>
      </div>
    </div>
  )
}

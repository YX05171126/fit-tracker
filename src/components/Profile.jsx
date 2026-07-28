import React, { useState } from 'react'
import { ACTIVITY_LEVELS, calculateTDEE, calculateMacros, estimateFatLoss, calculateBMI } from '../utils/tdee'

export default function Profile({ profile, setProfile, tdeeData, macros, onDone, isSetup, weightLogs, onLogout }) {
  const [form, setForm] = useState({ ...profile })

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setProfile({ ...form })
    if (onDone) onDone()
  }

  const previewTdee = calculateTDEE(form)
  const previewMacros = calculateMacros(previewTdee.targetCalories, form.weightKg)
  const fatLoss = estimateFatLoss(previewTdee.deficitKcal)
  const bmi = calculateBMI(form.weightKg, form.heightCm)

  // 最近体重记录
  const recentWeights = [...(weightLogs || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <div>
      {isSetup && (
        <div className="card setup-welcome">
          <h1>🏋️</h1>
          <h1 style={{ fontSize: 22 }}>欢迎使用 FitTracker</h1>
          <p>科学减脂助手，基于 Mifflin-St Jeor 公式<br />精准计算你的热量目标和营养素配比</p>
          <ul className="setup-features" style={{ listStyle: 'none' }}>
            <li>🔬 科学 TDEE 计算（15% 热量缺口）</li>
            <li>🍽️ 饮食记录 & 中国食物数据库</li>
            <li>📊 体重/围度追踪 & 趋势图表</li>
            <li>🎯 实时宏量营养素监控</li>
          </ul>
          <p className="text-hint">请先填写你的身体数据 👇</p>
        </div>
      )}

      {/* ── 身体数据 ── */}
      <div className="card">
        <div className="card-title">👤 身体数据</div>
        <div className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">性别</label>
              <select className="form-select" value={form.gender} onChange={e => handleChange('gender', e.target.value)}>
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">年龄</label>
              <input className="form-input" type="number" value={form.age}
                onChange={e => handleChange('age', Number(e.target.value))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">身高 (cm)</label>
              <input className="form-input" type="number" value={form.heightCm}
                onChange={e => handleChange('heightCm', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">体重 (kg)</label>
              <input className="form-input" type="number" step="0.1" value={form.weightKg}
                onChange={e => handleChange('weightKg', Number(e.target.value))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">体脂率 (%) — 可选，用于 Katch-McArdle 公式</label>
            <input className="form-input" type="number" step="0.1" value={form.bodyFatPct}
              placeholder="不清楚可留空"
              onChange={e => handleChange('bodyFatPct', e.target.value ? Number(e.target.value) : '')} />
          </div>

          <div className="form-group">
            <label className="form-label">活动水平</label>
            <div className="activity-options">
              {ACTIVITY_LEVELS.map(level => (
                <div key={level.key}
                  className={`activity-option ${form.activityLevel === level.key ? 'selected' : ''}`}
                  onClick={() => handleChange('activityLevel', level.key)}
                >
                  <div className="label">{level.label} <span className="text-hint">×{level.factor}</span></div>
                  <div className="desc">{level.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">计算公式</label>
            <select className="form-select" value={form.formula} onChange={e => handleChange('formula', e.target.value)}>
              <option value="mifflin">Mifflin-St Jeor（金标准，推荐）</option>
              <option value="katch" disabled={!form.bodyFatPct}>Katch-McArdle（需体脂率）</option>
              <option value="harris">Harris-Benedict（经典）</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── TDEE 计算结果 ── */}
      <div className="card">
        <div className="card-title">🔬 TDEE 计算结果</div>
        <div className="tdee-result">
          <div className="tdee-row">
            <span className="tdee-label">基础代谢 (BMR)</span>
            <span className="tdee-value">{previewTdee.bmr} kcal</span>
          </div>
          <div className="tdee-row">
            <span className="tdee-label">每日消耗 (TDEE) · {previewTdee.activityLabel}</span>
            <span className="tdee-value">{previewTdee.tdee} kcal</span>
          </div>
          <div className="tdee-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <span className="tdee-label">🎯 目标摄入（15% 缺口）</span>
            <span className="tdee-value tdee-highlight">{previewTdee.targetCalories} kcal</span>
          </div>
          <div className="tdee-row">
            <span className="tdee-label">热量缺口</span>
            <span className="tdee-value">{previewTdee.deficitKcal} kcal/天</span>
          </div>
          <p className="ratio-formula">公式: {previewTdee.formulaLabel}</p>
        </div>

        <div className="stat-grid mt-12">
          <div className="stat-item">
            <div className="stat-value">{fatLoss.perWeekKg} kg</div>
            <div className="stat-label">预计每周减重</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{fatLoss.perMonthKg} kg</div>
            <div className="stat-label">预计每月减重</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: bmi.color }}>{bmi.value}</div>
            <div className="stat-label">BMI · {bmi.label}</div>
          </div>
        </div>
      </div>

      {/* ── 宏量营养素分配 ── */}
      <div className="card">
        <div className="card-title">🥗 宏量营养素目标</div>
        <div className="macro-list">
          {[
            { key: 'protein', emoji: '🥩', name: '蛋白质', data: previewMacros.protein, color: '#F44336' },
            { key: 'fat',     emoji: '🥑', name: '脂肪',   data: previewMacros.fat,     color: '#FF9800' },
            { key: 'carbs',   emoji: '🍚', name: '碳水',   data: previewMacros.carbs,   color: '#2196F3' },
          ].map(m => (
            <div key={m.key} className="macro-item">
              <span className="macro-emoji">{m.emoji}</span>
              <div className="macro-info">
                <div className="macro-header">
                  <span className="macro-name">{m.name} ({m.data.pct}%)</span>
                  <span className="macro-value">{m.data.grams}g · {m.data.kcal} kcal</span>
                </div>
                <div className="macro-bar-bg">
                  <div className="macro-bar-fg" style={{
                    width: `${m.data.pct}%`,
                    backgroundColor: m.color,
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-hint mt-8">
          💡 蛋白质 2.0g/kg 体重，帮助减脂期保持肌肉量
        </p>
      </div>

      {/* ── 体重历史 ── */}
      {recentWeights.length > 0 && (
        <div className="card">
          <div className="card-title">📋 近期体重记录</div>
          {recentWeights.map(w => (
            <div key={w.date} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 14 }}>{w.date}</span>
              <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{w.weight} kg</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-block mt-16" onClick={handleSave}>
        {isSetup ? '🚀 开始使用' : '💾 保存设置'}
      </button>
      {!isSetup && onLogout && (
        <button className="btn btn-outline btn-block mt-8" onClick={onLogout}
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          🚪 退出登录
        </button>
      )}
      <div style={{ height: 20 }} />
    </div>
  )
}

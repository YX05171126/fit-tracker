import React, { useMemo } from 'react'
import { generateAdvice } from '../utils/adviceEngine'
import { generateExerciseGuidance } from '../utils/exerciseRecommender'
import { calculateBMI } from '../utils/tdee'
import { analyzeProgress } from '../utils/progressAnalyzer'
import MEAL_TEMPLATES, { recommendMeals } from '../data/mealTemplates'

const PRIORITY_STYLES = {
  high:   { borderColor: '#F44336', bg: '#FFF5F5', dot: '#F44336', label: '重要' },
  medium: { borderColor: '#FF9800', bg: '#FFF8F0', dot: '#FF9800', label: '建议' },
  low:    { borderColor: '#4CAF50', bg: '#F5FFF5', dot: '#4CAF50', label: '提示' },
}

export default function Guide({ tdeeData, macros, todayTotals, todayLog, profile, todayExercises, exerciseKcalToday, weightLogs, exerciseLogs, foodLogs, todayWater, waterGoal }) {
  // ─── 饮食建议 ───
  const adviceList = useMemo(() =>
    generateAdvice({ todayTotals, tdeeData, macros, todayLog, exerciseKcalToday }),
    [todayTotals, tdeeData, macros, todayLog, exerciseKcalToday]
  )

  // ─── 本周运动天数 ───
  const daysActiveThisWeek = useMemo(() => {
    let count = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const exercises = exerciseLogs[key]
      if (exercises && exercises.length > 0) count++
    }
    return count
  }, [exerciseLogs])

  // ─── 减重进度分析 ───
  const progressAnalysis = useMemo(() =>
    analyzeProgress(weightLogs, foodLogs, exerciseLogs, tdeeData.tdee),
    [weightLogs, foodLogs, exerciseLogs, tdeeData.tdee]
  )

  // ─── 运动指导 ───
  const exerciseGuidance = useMemo(() =>
    generateExerciseGuidance(profile, exerciseKcalToday, daysActiveThisWeek),
    [profile, exerciseKcalToday, daysActiveThisWeek]
  )

  // ─── 智能菜谱推荐 ───
  const mealRecommendations = useMemo(() => {
    const remainingKcal = tdeeData.targetCalories - todayTotals.kcal + exerciseKcalToday
    const macroGaps = {
      protein: Math.max(0, macros.protein.grams - todayTotals.protein),
      fat: Math.max(0, macros.fat.grams - todayTotals.fat),
      carbs: Math.max(0, macros.carbs.grams - todayTotals.carbs),
    }
    if (remainingKcal < 100) return null // 热量已用完，不推荐

    // 确定当前时间适合推荐哪一餐
    const hour = new Date().getHours()
    let mealType = 'any'
    if (hour >= 5 && hour < 10) mealType = 'breakfast'
    else if (hour >= 11 && hour < 14) mealType = 'lunch'
    else if (hour >= 17 && hour < 21) mealType = 'dinner'

    const picks = recommendMeals(remainingKcal, macroGaps, mealType)
    return { remainingKcal, macroGaps, picks, mealType }
  }, [todayTotals, tdeeData, macros, exerciseKcalToday])

  // ─── BMI & 体重变化 ───
  const bmi = useMemo(() => calculateBMI(profile.weightKg, profile.heightCm), [profile])
  const netKcal = todayTotals.kcal - exerciseKcalToday
  const remainingBudget = tdeeData.targetCalories - netKcal

  return (
    <div>
      {/* ── 减重进度分析 ── */}
      {progressAnalysis && (
        <div className="card">
          <div className="card-title">📊 减重进度分析</div>

          {/* 核心结论 */}
          <div className="analysis-verdict" style={{
            background: progressAnalysis.analysis.verdictColor + '15',
            borderLeft: `4px solid ${progressAnalysis.analysis.verdictColor}`,
          }}>
            <div className="analysis-verdict-label" style={{ color: progressAnalysis.analysis.verdictColor }}>
              {progressAnalysis.analysis.verdict}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {progressAnalysis.analysis.summary}
            </div>
          </div>

          {/* 关键数据 */}
          <div className="stat-grid mt-12" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="stat-item">
              <div className="stat-value" style={{ color: progressAnalysis.actualLoss > 0 ? 'var(--primary-dark)' : 'var(--danger)' }}>
                {progressAnalysis.actualLoss > 0 ? '-' : '+'}{Math.abs(progressAnalysis.actualLoss)} kg
              </div>
              <div className="stat-label">
                实际减重 ({progressAnalysis.startDate.slice(5)} → {progressAnalysis.endDate.slice(5)})
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: progressAnalysis.theoreticalLoss > 0 ? '#2196F3' : 'var(--danger)' }}>
                -{progressAnalysis.theoreticalLoss} kg
              </div>
              <div className="stat-label">
                理论应减 ({progressAnalysis.daysElapsed} 天)
              </div>
            </div>
          </div>

          {/* 细项 */}
          <div className="analysis-details mt-12">
            <div className="analysis-row">
              <span>起始体重</span>
              <strong>{progressAnalysis.startWeight} kg</strong>
            </div>
            <div className="analysis-row">
              <span>当前体重</span>
              <strong>{progressAnalysis.currentWeight} kg</strong>
            </div>
            <div className="analysis-row">
              <span>累计热量缺口</span>
              <strong style={{ color: progressAnalysis.cumulativeDeficit > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                {progressAnalysis.cumulativeDeficit > 0 ? '-' : '+'}{Math.abs(progressAnalysis.cumulativeDeficit)} kcal
              </strong>
            </div>
            <div className="analysis-row">
              <span>日均缺口</span>
              <strong>{progressAnalysis.avgDailyDeficit > 0 ? '-' : '+'}{Math.abs(progressAnalysis.avgDailyDeficit)} kcal/天</strong>
            </div>
            {progressAnalysis.complianceRate !== null && (
              <div className="analysis-row">
                <span>追踪依从率</span>
                <strong style={{
                  color: progressAnalysis.complianceRate >= 85 && progressAnalysis.complianceRate <= 115
                    ? 'var(--primary)' : 'var(--warning)'
                }}>
                  {progressAnalysis.complianceRate}%
                </strong>
              </div>
            )}
            <div className="analysis-row">
              <span>饮食记录覆盖</span>
              <strong>{progressAnalysis.analysis.trackingRate}%（{progressAnalysis.daysWithFoodData}/{progressAnalysis.daysElapsed} 天）</strong>
            </div>
            <div className="analysis-row">
              <span>运动天数</span>
              <strong>{progressAnalysis.daysWithExercise} 天</strong>
            </div>
          </div>

          {/* 详细建议 */}
          {progressAnalysis.analysis.tips.length > 0 && (
            <div className="analysis-tips mt-12">
              {progressAnalysis.analysis.tips.map((tip, i) => (
                <div key={i} className="analysis-tip-item">
                  <span className="analysis-tip-dot">{i + 1}</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 今日概览 ── */}
      <div className="card">
        <div className="card-title">📋 今日概览</div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-item">
            <div className="stat-value" style={{
              color: remainingBudget >= 0 ? 'var(--primary-dark)' : 'var(--danger)',
            }}>
              {netKcal}
            </div>
            <div className="stat-label">净摄入 kcal</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: exerciseKcalToday > 0 ? 'var(--warning)' : undefined }}>
              {exerciseKcalToday}
            </div>
            <div className="stat-label">运动消耗</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{daysActiveThisWeek}</div>
            <div className="stat-label">本周运动天数</div>
          </div>
        </div>

        {/* 快览状态条 */}
        <div className="guide-summary mt-12">
          <div className="summary-row">
            <span>🎯 目标</span>
            <span><strong>{tdeeData.targetCalories}</strong> kcal · 15% 缺口</span>
          </div>
          <div className="summary-row">
            <span>⚖️ BMI</span>
            <span style={{ color: bmi.color }}><strong>{bmi.value}</strong> · {bmi.label}</span>
          </div>
          <div className="summary-row">
            <span>🔥 TDEE</span>
            <span>{tdeeData.tdee} kcal · {tdeeData.activityLabel}</span>
          </div>
        </div>
      </div>

      {/* ── 饮食建议 ── */}
      <div className="card">
        <div className="card-title">🥗 饮食建议</div>
        {adviceList.length === 0 ? (
          <p className="text-hint text-center" style={{ padding: '12px 0' }}>
            记录饮食后会显示个性化建议
          </p>
        ) : (
          <div className="advice-list">
            {adviceList.map((advice, i) => {
              const style = PRIORITY_STYLES[advice.priority] || PRIORITY_STYLES.low
              return (
                <div key={i} className="advice-card" style={{
                  borderLeft: `3px solid ${style.borderColor}`,
                  background: style.bg,
                }}>
                  <div className="advice-header">
                    <span className="advice-dot" style={{ background: style.dot }} />
                    <span className="advice-title">{advice.title}</span>
                    <span className="advice-badge" style={{
                      color: style.borderColor,
                      background: style.bg,
                      border: `1px solid ${style.borderColor}`,
                    }}>{style.label}</span>
                  </div>
                  <p className="advice-message">{advice.message}</p>
                  {advice.foods && advice.foods.length > 0 && (
                    <div className="advice-foods mt-8">
                      <span className="text-hint">推荐：</span>
                      {advice.foods.map((f, j) => (
                        <span key={j} className="food-tag">{f}</span>
                      ))}
                    </div>
                  )}
                  {advice.swaps && advice.swaps.length > 0 && (
                    <div className="advice-swaps mt-8">
                      <span className="text-hint">健康替换：</span>
                      {advice.swaps.map((s, j) => (
                        <span key={j} className="swap-tag">
                          {s.from} → {s.to}
                          <span className="swap-reason">{s.reason}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 餐食时间指导 ── */}
      <div className="card">
        <div className="card-title">🕗 餐食时间指导</div>
        <p className="text-hint" style={{ marginBottom: 10 }}>
          同样的热量，不同时间吃效果不同。进食节律影响胰岛素敏感性、脂肪氧化和代谢率。
        </p>

        <div className="meal-timing">
          <div className="meal-timing-slot breakfast">
            <div className="meal-timing-time">🌅 7:00-9:00</div>
            <div className="meal-timing-label">早餐 · 全天热量 30%</div>
            <div className="meal-timing-desc">启动代谢开关，不吃早餐静息代谢低 5-8%</div>
          </div>
          <div className="meal-timing-slot lunch">
            <div className="meal-timing-time">☀️ 11:30-13:30</div>
            <div className="meal-timing-label">午餐 · 全天热量 40%</div>
            <div className="meal-timing-desc">一天中最大的一餐，胰岛素敏感性最高时段</div>
          </div>
          <div className="meal-timing-slot dinner">
            <div className="meal-timing-time">🌆 17:30-19:00</div>
            <div className="meal-timing-label">晚餐 · 全天热量 30%</div>
            <div className="meal-timing-desc">睡前 3 小时吃完，避免影响生长激素和睡眠</div>
          </div>
        </div>

        <div className="meal-timing-tips mt-8">
          <div className="tip-item">⏰ 三餐间隔 4-5 小时，避免长时间空腹导致的暴食</div>
          <div className="tip-item">🚫 晚餐后不再进食 — 夜间进食热量转为脂肪的效率高 30%</div>
          <div className="tip-item">🔥 运动安排在午餐前或下午，餐后 1-2 小时运动最佳</div>
        </div>
      </div>

      {/* ── 智能菜谱推荐 ── */}
      <div className="card">
        <div className="card-title">🍽️ 智能菜谱推荐</div>
        {mealRecommendations && mealRecommendations.picks.length > 0 ? (
          <div>
            <div className="meal-rec-header mb-12">
              <div className="summary-row">
                <span>剩余预算</span>
                <strong style={{ color: 'var(--primary-dark)' }}>{mealRecommendations.remainingKcal} kcal</strong>
              </div>
              <div className="summary-row">
                <span>还需补充</span>
                <span style={{ fontSize: 12 }}>
                  蛋白质 {mealRecommendations.macroGaps.protein}g · 脂肪 {mealRecommendations.macroGaps.fat}g · 碳水 {mealRecommendations.macroGaps.carbs}g
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              📌 基于剩余热量和营养素缺口，为你推荐以下餐食：
            </p>
            <div className="meal-rec-list">
              {mealRecommendations.picks.map((meal, i) => (
                <div key={meal.id} className="meal-rec-card" style={{
                  borderLeft: i === 0 ? '3px solid var(--primary)' : '3px solid var(--border)',
                  background: i === 0 ? '#F5FFF5' : '#fff',
                }}>
                  <div className="meal-rec-header-row">
                    <div>
                      <span className="meal-rec-name">{meal.name}</span>
                      {i === 0 && <span className="meal-rec-best">🏆 最佳匹配</span>}
                    </div>
                    <span className="meal-rec-kcal">{meal.kcal} kcal</span>
                  </div>
                  <div className="meal-rec-macros">
                    <span className="macro-tag protein">P:{meal.p}g</span>
                    <span className="macro-tag fat">F:{meal.f}g</span>
                    <span className="macro-tag carbs">C:{meal.c}g</span>
                  </div>
                  <div className="meal-rec-foods mt-8">
                    <span className="text-hint">食材：</span>
                    {meal.foods.map((f, j) => (
                      <span key={j} className="food-tag">{f}</span>
                    ))}
                  </div>
                  <div className="meal-rec-method mt-8">
                    <span className="text-hint">做法：</span>{meal.method}
                  </div>
                  <div className="meal-rec-suitable mt-8">
                    <span className="text-hint">适合：</span>{meal.suitable}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-hint mt-8" style={{ textAlign: 'center' }}>
              💡 以上菜谱基于你的剩余热量和营养素缺口实时推荐
            </p>
          </div>
        ) : (
          <div className="chart-empty">
            {mealRecommendations === null
              ? '今日热量预算已用完，明天再来看看吧！'
              : '正在分析营养素缺口...'}
          </div>
        )}
      </div>

      {/* ── 运动建议 ── */}
      <div className="card">
        <div className="card-title">💪 运动指导</div>

        {/* 每日运动提示 */}
        <div className="advice-card" style={{
          borderLeft: `3px solid ${exerciseKcalToday >= 300 ? '#4CAF50' : exerciseKcalToday > 0 ? '#FF9800' : '#2196F3'}`,
          background: '#F5F8FF',
        }}>
          <div className="advice-header">
            <span style={{ fontSize: 24, marginRight: 8 }}>{exerciseGuidance.dailyTip.icon}</span>
            <div>
              <span className="advice-title">{exerciseGuidance.dailyTip.title}</span>
              <p className="advice-message" style={{ marginTop: 2 }}>
                {exerciseGuidance.dailyTip.message}
              </p>
            </div>
          </div>
        </div>

        {/* 周计划 */}
        <div className="mt-12">
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            📅 推荐周训练计划
            <span className="text-hint" style={{ marginLeft: 6, fontWeight: 400 }}>
              ({profile.activityLevel === 'sedentary' ? '新手入门' : profile.activityLevel === 'light' ? '初级' : profile.activityLevel === 'moderate' ? '中级' : '进阶'})
            </span>
          </h4>
          <div className="weekly-plan">
            {exerciseGuidance.weeklyPlan.map((day, i) => (
              <div key={i} className="weekly-day">
                <div className="weekly-day-label">{day.day}</div>
                <div className="weekly-day-content">
                  <div className="weekly-day-activity">{day.activity}</div>
                  <div className="weekly-day-desc">{day.desc}</div>
                </div>
                <div className="weekly-day-duration">{day.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 减脂塑形贴士 ── */}
      <div className="card">
        <div className="card-title">🧠 减脂塑形贴士</div>
        <div className="tips-list">
          {exerciseGuidance.recompositionTips.map((tip, i) => (
            <div key={i} className="tip-item">
              {tip}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  )
}

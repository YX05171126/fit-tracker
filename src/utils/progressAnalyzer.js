/**
 * 减重进度分析引擎
 * 对比理论减重（基于累计热量缺口）vs 实际体重变化
 * 1kg 脂肪 ≈ 7700 kcal
 */

/** 计算两个日期之间的天数 */
function daysBetween(d1, d2) {
  return Math.round((new Date(d2) - new Date(d1)) / 86400000)
}

/** 生成日期范围内的所有日期 key */
function* dateRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  while (s <= e) {
    yield `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`
    s.setDate(s.getDate() + 1)
  }
}

/** 汇总某天的食物热量 */
function dayFoodKcal(foodLogs, dateKey) {
  const day = foodLogs[dateKey]
  if (!day) return 0
  let kcal = 0
  Object.values(day.meals).forEach(items => {
    items.forEach(f => { kcal += f.kcal || 0 })
  })
  return kcal
}

/** 汇总某天的运动消耗 */
function dayExerciseKcal(exerciseLogs, dateKey) {
  const exercises = exerciseLogs[dateKey]
  if (!exercises) return 0
  return exercises.reduce((sum, e) => sum + (e.kcalBurned || 0), 0)
}

/**
 * 分析减重进度
 * @param {Array} weightLogs — [{date, weight}, ...]
 * @param {Object} foodLogs — { "YYYY-MM-DD": { meals: {...} } }
 * @param {Object} exerciseLogs — { "YYYY-MM-DD": [...] }
 * @param {number} currentTDEE — 当前每日消耗
 * @returns {Object|null} 分析结果，或 null（数据不足）
 */
export function analyzeProgress(weightLogs, foodLogs, exerciseLogs, currentTDEE) {
  if (!weightLogs || weightLogs.length < 2) return null

  const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  const actualLoss = first.weight - last.weight // 正数 = 减重
  const daysElapsed = Math.max(1, daysBetween(first.date, last.date))

  // ─── 累计理论缺口 ───
  let cumulativeDeficit = 0
  let daysWithFoodData = 0
  let daysWithExercise = 0
  const dailyDetails = []

  for (const dateKey of dateRange(first.date, last.date)) {
    const foodKcal = dayFoodKcal(foodLogs, dateKey)
    const exerciseKcal = dayExerciseKcal(exerciseLogs, dateKey)

    if (foodKcal > 0) daysWithFoodData++
    if (exerciseKcal > 0) daysWithExercise++

    // 当日热量缺口
    const dayDeficit = currentTDEE - foodKcal + exerciseKcal
    cumulativeDeficit += dayDeficit
    dailyDetails.push({ date: dateKey, foodKcal, exerciseKcal, deficit: dayDeficit })
  }

  const theoreticalLoss = cumulativeDeficit / 7700 // kg
  const avgDailyDeficit = cumulativeDeficit / daysElapsed

  // ─── 依从率 ───
  let complianceRate = null
  if (Math.abs(theoreticalLoss) > 0.01) {
    complianceRate = (actualLoss / theoreticalLoss) * 100
  }

  // ─── 生成分析 ───
  const analysis = generateAnalysis({
    actualLoss,
    theoreticalLoss,
    complianceRate,
    cumulativeDeficit,
    daysElapsed,
    daysWithFoodData,
    daysWithExercise,
    avgDailyDeficit,
    startWeight: first.weight,
    currentWeight: last.weight,
  })

  return {
    startDate: first.date,
    endDate: last.date,
    startWeight: first.weight,
    currentWeight: last.weight,
    actualLoss: +actualLoss.toFixed(2),
    theoreticalLoss: +theoreticalLoss.toFixed(2),
    complianceRate: complianceRate !== null ? +complianceRate.toFixed(0) : null,
    cumulativeDeficit: Math.round(cumulativeDeficit),
    daysElapsed,
    daysWithFoodData,
    daysWithExercise,
    avgDailyDeficit: Math.round(avgDailyDeficit),
    analysis,
  }
}

/**
 * 根据数据生成分析文本和建议
 */
function generateAnalysis({ actualLoss, theoreticalLoss, complianceRate, cumulativeDeficit, daysElapsed, daysWithFoodData, daysWithExercise, avgDailyDeficit, startWeight, currentWeight }) {
  const tips = []
  let verdict = ''
  let verdictColor = ''

  // 无食物数据
  if (daysWithFoodData === 0) {
    return {
      verdict: '📝 数据不足',
      verdictColor: '#9E9E9E',
      summary: '还没有记录饮食数据，无法计算理论减重。开始记录饮食后，这里会显示理论 vs 实际的对比分析。',
      tips: ['从今天开始记录每餐饮食，累积数据后分析才有意义'],
    }
  }

  // 饮食记录覆盖率
  const trackingRate = (daysWithFoodData / daysElapsed * 100)

  // 核心判断
  if (actualLoss < -0.1) {
    // 体重增加了
    verdict = '⚠️ 体重上升'
    verdictColor = '#F44336'
    if (cumulativeDeficit > 0) {
      tips.push(`虽然累计热量缺口 ${Math.round(cumulativeDeficit)} kcal（理论应减 ${theoreticalLoss.toFixed(1)} kg），但实际体重增加了 ${Math.abs(actualLoss).toFixed(1)} kg`)
      tips.push('可能原因：食物热量被低估（尤其是外卖和酱料）、运动消耗被高估、水分波动、称重时间不一致')
      tips.push('建议：使用食物秤精确称量 3-5 天，找到热量低估的来源')
    } else {
      tips.push(`累计热量盈余 ${Math.abs(Math.round(cumulativeDeficit))} kcal（超出 TDEE），体重增加符合预期`)
      tips.push('建议重新审视饮食记录，控制总热量摄入在目标范围内')
    }
  } else if (complianceRate !== null) {
    if (complianceRate >= 85 && complianceRate <= 115) {
      verdict = '✅ 高度吻合'
      verdictColor = '#4CAF50'
      tips.push(`理论应减 ${theoreticalLoss.toFixed(1)} kg，实际减了 ${actualLoss.toFixed(1)} kg，偏差仅 ${Math.abs(100 - complianceRate)}%`)
      tips.push('热量追踪非常准确，饮食记录质量很高，继续保持！')
    } else if (complianceRate >= 70 && complianceRate < 85) {
      verdict = '🟡 基本吻合'
      verdictColor = '#FF9800'
      tips.push(`理论应减 ${theoreticalLoss.toFixed(1)} kg，实际减了 ${actualLoss.toFixed(1)} kg，完成率 ${complianceRate}%`)
      tips.push('可能存在轻微的食物漏记或份量低估（约 ' + Math.abs(Math.round(theoreticalLoss - actualLoss) * 7700 / daysElapsed) + ' kcal/天 的偏差）')
      tips.push('建议：注意酱料、油、饮料等「隐形热量」')
    } else if (complianceRate > 115) {
      verdict = '🔵 超预期减重'
      verdictColor = '#2196F3'
      tips.push(`理论应减 ${theoreticalLoss.toFixed(1)} kg，实际减了 ${actualLoss.toFixed(1)} kg，超出预期 ${complianceRate - 100}%`)
      tips.push('可能原因：运动消耗被低估、日常活动量（NEAT）比预期高、基础代谢偏高')
      tips.push('减重速度偏快，注意蛋白质摄入防止肌肉流失')
    } else {
      verdict = '🔴 显著偏差'
      verdictColor = '#F44336'
      tips.push(`理论应减 ${theoreticalLoss.toFixed(1)} kg，实际只减了 ${actualLoss.toFixed(1)} kg，完成率仅 ${complianceRate}%`)
      tips.push(`平均每天的热量追踪偏差约为 ${Math.abs(Math.round((theoreticalLoss - actualLoss) * 7700 / daysElapsed))} kcal`)
      tips.push('强烈建议：使用食物秤称量所有食物 1 周，特别关注炒菜油、酱料、零食和饮料')
      tips.push('检查称重条件是否一致：建议每天早晨空腹、排便后、穿同样衣服称重')
    }
  }

  // 通用建议
  if (trackingRate < 50) {
    tips.push(`饮食记录覆盖率仅 ${Math.round(trackingRate)}%，未记录的日子无法计算实际摄入，影响分析准确性`)
  }

  if (daysWithExercise === 0 && daysElapsed > 7) {
    tips.push('期间没有记录运动。运动不仅消耗热量，还能提升代谢，建议加入力量训练')
  }

  // 摘要
  let summary = ''
  if (complianceRate !== null && complianceRate >= 85 && complianceRate <= 115) {
    summary = '你的饮食追踪非常精准！理论计算与实际体重变化高度一致，说明你的热量记录质量很高。继续保持当前的节奏。'
  } else if (complianceRate !== null) {
    summary = `理论减重与实际减重之间存在偏差。这通常意味着食物热量的估算需要更精确。尝试用食物秤称量 1-2 周可以大幅提高准确度。`
  } else if (actualLoss >= 0) {
    summary = '开始记录体重和饮食数据后，这里会展示详细的数据对比分析。'
  }

  return {
    verdict,
    verdictColor,
    summary,
    tips,
    trackingRate: Math.round(trackingRate),
  }
}

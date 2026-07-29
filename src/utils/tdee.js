/**
 * 科学热量计算模块
 * ───────────────────────────────────────────
 * Mifflin-St Jeor (金标准) + Katch-McArdle (体脂修正) + Harris-Benedict
 * 15% 热量缺口 → 减脂目标摄入
 */

// ─── 活动系数映射 ───────────────────────────
export const ACTIVITY_LEVELS = [
  { key: 'sedentary',    label: '久坐不动',     desc: '几乎不运动，办公室工作',          factor: 1.2 },
  { key: 'light',        label: '轻度活跃',     desc: '每周运动 1-3 天',                factor: 1.375 },
  { key: 'moderate',     label: '中度活跃',     desc: '每周运动 3-5 天',                factor: 1.55 },
  { key: 'active',        label: '非常活跃',     desc: '每周运动 6-7 天',                factor: 1.725 },
  { key: 'extreme',      label: '极度活跃',     desc: '高强度训练 / 体力劳动者',         factor: 1.9 },
]

// ─── BMR 公式 ────────────────────────────────

/**
 * Mifflin-St Jeor (1990) — 学界公认最精准
 * 适用于大多数人群，误差约 ±10%
 */
export function bmrMifflinStJeor({ gender, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

/**
 * Katch-McArdle — 体脂率已知时最精准
 * 基于瘦体重 (LBM)，对健身人群尤其准确
 */
export function bmrKatchMcArdle({ weightKg, bodyFatPct }) {
  const lbm = weightKg * (1 - bodyFatPct / 100)
  return 370 + 21.6 * lbm
}

/**
 * Harris-Benedict (修订版 1984)
 * 经典公式，作为参考对比
 */
export function bmrHarrisBenedict({ gender, weightKg, heightCm, age }) {
  if (gender === 'male') {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age
}

// ─── TDEE & 目标计算 ─────────────────────────

/**
 * 计算每日总消耗 TDEE
 * @returns {{ bmr: number, tdee: number, targetCalories: number, deficit: number }}
 */
export function calculateTDEE(profile) {
  const { formula = 'mifflin', gender, weightKg, heightCm, age, activityLevel, bodyFatPct } = profile

  let bmr
  if (formula === 'katch' && bodyFatPct !== undefined && bodyFatPct > 0) {
    bmr = bmrKatchMcArdle({ weightKg, bodyFatPct })
  } else if (formula === 'harris') {
    bmr = bmrHarrisBenedict({ gender, weightKg, heightCm, age })
  } else {
    bmr = bmrMifflinStJeor({ gender, weightKg, heightCm, age }) // 默认金标准
  }

  const activity = ACTIVITY_LEVELS.find(a => a.key === activityLevel) || ACTIVITY_LEVELS[0]
  const tdee = Math.round(bmr * activity.factor)

  // 用户可调热量缺口，默认 15%
  const deficitPercent = profile.deficitPercent ?? 15
  const deficit = deficitPercent / 100
  const targetCalories = Math.round(tdee * (1 - deficit))

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    deficitPercent,
    deficitKcal: tdee - targetCalories,
    activityLabel: activity.label,
    formulaLabel: formula === 'katch' ? 'Katch-McArdle' : formula === 'harris' ? 'Harris-Benedict' : 'Mifflin-St Jeor',
  }
}

/**
 * 计算宏量营养素目标
 * 减脂期：高蛋白保肌肉 + 适量碳水供能 + 健康脂肪
 */
export function calculateMacros(targetCalories, weightKg) {
  // 蛋白质: 2.0g/kg 体重，至少占总热量 35%
  const proteinG = Math.round(weightKg * 2.0)
  const proteinKcal = proteinG * 4

  // 脂肪: 占总热量 25%
  const fatKcal = targetCalories * 0.25
  const fatG = Math.round(fatKcal / 9)

  // 碳水: 剩余热量
  const carbKcal = targetCalories - proteinKcal - fatKcal
  const carbG = Math.round(carbKcal / 4)

  return {
    protein: { grams: proteinG, kcal: proteinKcal, pct: Math.round(proteinKcal / targetCalories * 100) },
    fat:     { grams: fatG,     kcal: Math.round(fatKcal),  pct: Math.round(fatKcal  / targetCalories * 100) },
    carbs:   { grams: carbG,    kcal: Math.round(carbKcal), pct: Math.round(carbKcal / targetCalories * 100) },
  }
}

/**
 * 预估减重速度
 * 1kg 脂肪 ≈ 7700 kcal
 */
export function estimateFatLoss(deficitKcal) {
  const weeklyDeficit = deficitKcal * 7
  const weeklyKg = weeklyDeficit / 7700
  return {
    perWeekKg: weeklyKg.toFixed(2),
    perMonthKg: (weeklyKg * 4).toFixed(1),
    perWeekLb: (weeklyKg * 2.2046).toFixed(2),
  }
}

/**
 * 计算 BMI 及分类
 */
export function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  let category
  if (bmi < 18.5) category = { label: '偏瘦', color: '#FF9800' }
  else if (bmi < 24) category = { label: '正常', color: '#4CAF50' }
  else if (bmi < 28) category = { label: '超重', color: '#FF9800' }
  else category = { label: '肥胖', color: '#F44336' }
  return { value: bmi.toFixed(1), ...category }
}

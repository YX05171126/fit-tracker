/**
 * 饮食建议引擎
 * 根据今日实际饮食数据，生成优先级排序的个性化建议
 */

// 蔬菜关键词匹配
const VEG_NAMES = ['西兰花','菠菜','番茄','黄瓜','生菜','大白菜','胡萝卜','香菇','芹菜','彩椒','芦笋','海带','茄子','青菜','白菜','卷心菜','油麦菜','空心菜','豆芽','青椒','洋葱','花菜','苦瓜','冬瓜','南瓜','秋葵','茼蒿']

// 高蛋白推荐食物
const PROTEIN_FOODS = ['鸡胸肉', '水煮蛋', '希腊酸奶', '虾仁', '豆腐', '蛋白粉(乳清)', '瘦牛肉', '三文鱼']

// 低卡饱腹食物
const LOW_CAL_FOODS = ['黄瓜', '番茄', '生菜', '西兰花', '大白菜', '芹菜', '海带', '菠菜']

// 健康替换映射
const SWAP_MAP = {
  '白米饭':   { to:'糙米饭',   reason:'更多膳食纤维，血糖反应更低' },
  '五花肉':   { to:'鸡胸肉',   reason:'高蛋白低脂肪，热量减少 50%' },
  '珍珠奶茶': { to:'无糖酸奶', reason:'蛋白质丰富，零添加糖' },
  '薯片':     { to:'混合坚果', reason:'健康脂肪 + 蛋白质，更有营养' },
  '可口可乐': { to:'零度可乐', reason:'零热量，口感接近' },
  '冰淇淋':   { to:'希腊酸奶', reason:'高蛋白 + 奶香口感，热量减半' },
  '炒面':     { to:'煮面条',   reason:'减少烹饪用油，热量降低约 30%' },
  '蛋炒饭':   { to:'糙米饭',   reason:'搭配菜品，减少油脂摄入' },
}

/**
 * @param {Object} ctx
 * @param {{kcal,protein,fat,carbs}} ctx.todayTotals — 今日实际摄入
 * @param {{targetCalories, deficitKcal, tdee}} ctx.tdeeData
 * @param {{protein:{grams}, fat:{grams}, carbs:{grams}}} ctx.macros — 目标值
 * @param {{meals:{breakfast:[],lunch:[],dinner:[],snack:[]}}} ctx.todayLog
 * @param {number} ctx.exerciseKcalToday — 今日运动消耗
 * @returns {Array<{priority:'high'|'medium'|'low', type:string, title:string, message:string, foods?:string[], swaps?:Array}>}
 */
export function generateAdvice({ todayTotals, tdeeData, macros, todayLog, exerciseKcalToday = 0 }) {
  const advice = []
  const { kcal, protein, fat, carbs } = todayTotals
  const { targetCalories } = tdeeData
  const remaining = targetCalories - kcal + exerciseKcalToday

  // 检查今天有哪些食物名字
  const allFoodNames = []
  Object.values(todayLog.meals).forEach(items => {
    items.forEach(f => allFoodNames.push(f.name))
  })

  // 检查是否吃了蔬菜
  const hasVegetables = allFoodNames.some(name => VEG_NAMES.some(v => name.includes(v)))
  // 早餐是否为空
  const breakfastEmpty = !todayLog.meals.breakfast || todayLog.meals.breakfast.length === 0
  // 零食热量占比
  const snackKcal = (todayLog.meals.snack || []).reduce((s, f) => s + (f.kcal || 0), 0)
  const snackRatio = kcal > 0 ? snackKcal / kcal : 0
  // 当前时间
  const currentHour = new Date().getHours()

  // ─── 规则 1：蛋白质严重不足 ───
  const proteinTarget = macros.protein.grams
  const proteinPct = proteinTarget > 0 ? protein / proteinTarget : 0
  if (proteinPct < 0.3 && remaining > 200) {
    advice.push({
      priority: 'high',
      type: 'protein_critical',
      title: '🥩 蛋白质严重不足',
      message: `今天蛋白质仅摄入 ${protein}g（目标 ${proteinTarget}g），严重不足。蛋白质是保持肌肉量的关键，减脂期尤其重要。`,
      foods: PROTEIN_FOODS,
    })
  }

  // ─── 规则 2：快超出热量 + 蛋白不足 ───
  if (remaining < 200 && remaining > -100 && proteinPct < 0.7 && proteinTarget > 0) {
    advice.push({
      priority: 'high',
      type: 'near_limit_low_protein',
      title: '⚠️ 热量即将超标，蛋白质还不够',
      message: `剩余热量仅 ${remaining} kcal，但蛋白质才完成 ${Math.round(proteinPct * 100)}%。建议选择纯蛋白食物补充。`,
      foods: ['蛋白粉(乳清)', '鸡胸肉', '虾仁', '脱脂牛奶'],
    })
  } else if (remaining < 200 && remaining > -100) {
    // ─── 规则 3：接近热量上限 ───
    advice.push({
      priority: 'high',
      type: 'near_limit',
      title: '⚠️ 接近今日热量上限',
      message: `仅剩 ${remaining} kcal 预算。如果还饿，可以选择低卡蔬菜增加饱腹感。`,
      foods: LOW_CAL_FOODS,
    })
  }

  // ─── 规则 4：没吃蔬菜 ───
  if (!hasVegetables && kcal > 300) {
    advice.push({
      priority: 'medium',
      type: 'no_vegetables',
      title: '🥬 今天还没吃蔬菜',
      message: '蔬菜富含膳食纤维和微量元素，热量低饱腹感强，减脂期建议每餐都搭配蔬菜。',
      foods: ['西兰花', '菠菜', '生菜', '黄瓜', '番茄'],
    })
  }

  // ─── 规则 5：没吃早餐 ───
  if (breakfastEmpty && currentHour >= 9 && currentHour < 14) {
    advice.push({
      priority: 'medium',
      type: 'skip_breakfast',
      title: '🍳 早餐很重要',
      message: '早餐能启动新陈代谢，避免午餐暴食。即使简单吃一点也有帮助。',
      foods: ['水煮蛋', '全麦面包', '燕麦片', '豆浆(无糖)'],
    })
  }

  // ─── 规则 6：脂肪超标 ───
  if (macros.fat.grams > 0 && fat > macros.fat.grams * 1.3) {
    advice.push({
      priority: 'medium',
      type: 'fat_high',
      title: '🛢️ 脂肪摄入偏高',
      message: `今日脂肪 ${fat}g，超过目标 ${macros.fat.grams}g 的 130%。建议减少炒菜用油，选择瘦肉和蒸煮方式。`,
      foods: ['鸡胸肉', '瘦牛肉', '清蒸鱼', '脱脂牛奶'],
    })
  }

  // ─── 规则 7：碳水超标 ───
  if (macros.carbs.grams > 0 && carbs > macros.carbs.grams * 1.3) {
    advice.push({
      priority: 'medium',
      type: 'carbs_high',
      title: '🍚 碳水摄入偏高',
      message: `今日碳水 ${carbs}g，已超出目标 ${macros.carbs.grams}g。可以将部分白米饭换成粗粮。`,
      foods: ['糙米饭', '蒸红薯', '燕麦片', '全麦面包'],
    })
  }

  // ─── 规则 8：零食占比过高 ───
  if (snackRatio > 0.4 && snackKcal > 150) {
    advice.push({
      priority: 'low',
      type: 'snack_heavy',
      title: '🍪 零食/饮料占比偏高',
      message: `零食饮料占总热量的 ${Math.round(snackRatio * 100)}%，减少加工零食有助于控制热量。`,
    })
  }

  // ─── 规则 9：摄入偏少（下午后） ───
  if (kcal < targetCalories * 0.45 && currentHour >= 17) {
    advice.push({
      priority: 'low',
      type: 'undereating',
      title: '📉 今天摄入偏少',
      message: `今日仅摄入 ${kcal} kcal（目标 ${targetCalories}），晚餐可以多吃一些，确保营养充足，避免代谢降低。`,
    })
  }

  // ─── 规则 10：超标了 ───
  if (kcal > tdeeData.tdee) {
    advice.push({
      priority: 'medium',
      type: 'over_tdee',
      title: '🔴 今日已超过 TDEE',
      message: `今日摄入 ${kcal} kcal，已超过每日消耗 ${tdeeData.tdee} kcal。超过 TDEE 意味着今天不会有热量缺口。明天回归正轨就好！`,
    })
  }

  // ─── 健康替换建议 ───
  const swaps = []
  for (const foodName of allFoodNames) {
    for (const [key, val] of Object.entries(SWAP_MAP)) {
      if (foodName.includes(key) && !swaps.find(s => s.from === key)) {
        swaps.push({ from: key, to: val.to, reason: val.reason })
      }
    }
  }
  if (swaps.length > 0 && advice.length > 0) {
    advice[0].swaps = swaps.slice(0, 3)
  }

  // ─── 默认：状态良好 ───
  if (advice.length === 0) {
    const macroSummary = []
    if (proteinPct >= 0.7 && proteinPct <= 1.1) macroSummary.push('蛋白质')
    const fatPct = macros.fat.grams > 0 ? fat / macros.fat.grams : 0
    if (fatPct >= 0.5 && fatPct <= 1.2) macroSummary.push('脂肪')
    const carbPct = macros.carbs.grams > 0 ? carbs / macros.carbs.grams : 0
    if (carbPct >= 0.5 && carbPct <= 1.2) macroSummary.push('碳水')

    advice.push({
      priority: 'low',
      type: 'on_track',
      title: macroSummary.length >= 2
        ? `✅ 做得不错！${macroSummary.join('、')}摄入均衡`
        : '✅ 今日进度正常',
      message: '继续保持健康饮食节奏。记得每天喝够 2 升水，充足睡眠也很重要！',
    })
  }

  return advice
}

/** 获取特定食物的健康替换建议 */
export function getSwapSuggestion(foodName) {
  for (const [key, val] of Object.entries(SWAP_MAP)) {
    if (foodName.includes(key)) return { from: key, ...val }
  }
  return null
}

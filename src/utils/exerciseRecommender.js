/**
 * 运动推荐引擎
 * 根据用户活动水平和今日运动情况，生成个性化训练建议
 */

/**
 * 生成运动指导
 * @param {Object} profile — 用户档案
 * @param {number} exerciseKcalToday — 今日运动消耗
 * @param {number} daysActiveThisWeek — 本周运动天数
 * @returns {{ dailyTip: {title, message, icon}, weeklyPlan: Array, recompositionTips: string[] }}
 */
export function generateExerciseGuidance(profile, exerciseKcalToday = 0, daysActiveThisWeek = 0) {
  const { activityLevel, weightKg } = profile

  // ─── 每日运动建议 ───
  let dailyTip
  if (exerciseKcalToday >= 300) {
    dailyTip = {
      icon: '🎉',
      title: '今日运动目标已达成',
      message: `已消耗 ${exerciseKcalToday} kcal，训练后记得补充蛋白质！`,
    }
  } else if (exerciseKcalToday > 0) {
    dailyTip = {
      icon: '👍',
      title: '今天有运动，但还可以加一点',
      message: `已消耗 ${exerciseKcalToday} kcal。再增加 15-20 分钟的有氧可以帮助达到目标。`,
    }
  } else if (daysActiveThisWeek >= 3) {
    dailyTip = {
      icon: '😌',
      title: '今天是休息日',
      message: '本周运动已达 3 天以上，适当休息有助于肌肉恢复。可以做些拉伸放松。',
    }
  } else {
    dailyTip = {
      icon: '💪',
      title: '今天还没有运动',
      message: activityLevel === 'sedentary'
        ? `建议从散步 30 分钟开始（约消耗 ${Math.round(2.5 * weightKg * 0.5)} kcal），循序渐进！`
        : `建议安排 30 分钟运动，力量训练 + 有氧结合效果最佳。`,
    }
  }

  // ─── 周计划 ───
  const weeklyPlan = generateWeeklyPlan(activityLevel)

  // ─── 减脂塑形贴士 ───
  const recompositionTips = [
    '💡 蛋白质建议 2.0g/kg 体重，配合力量训练可有效减少肌肉流失',
    '💡 有氧 + 力量结合比单纯有氧更有利于减脂塑形',
    '💡 每周至少 2-3 次力量训练，每次间隔 48 小时让肌肉恢复',
    '💡 训练后 30-60 分钟内补充蛋白质（鸡胸肉/鸡蛋/蛋白粉）效果最佳',
    '💡 每天步行 8000 步以上可额外消耗约 200-300 kcal',
    '💡 减脂期保持 NEAT（非运动消耗）很重要：多走路、爬楼梯、做家务',
  ]

  return { dailyTip, weeklyPlan, recompositionTips }
}

/**
 * 根据活动水平生成周训练计划
 */
function generateWeeklyPlan(activityLevel) {
  const plans = {
    sedentary: [
      { day:'周一', activity:'全身自重训练',   duration:'20 min', desc:'俯卧撑 ×10、深蹲 ×15、平板支撑 30s ×3' },
      { day:'周二', activity:'快走',             duration:'30 min', desc:'保持中等速度，心率微微提升' },
      { day:'周三', activity:'休息或拉伸',       duration:'15 min', desc:'肩颈拉伸 + 腿后侧拉伸' },
      { day:'周四', activity:'全身自重训练',     duration:'20 min', desc:'同周一，可增加 1 组' },
      { day:'周五', activity:'快走或骑行',       duration:'30 min', desc:'选择喜欢的轻度有氧' },
      { day:'周六', activity:'户外活动',         duration:'45 min', desc:'散步、羽毛球、骑车都可以' },
      { day:'周日', activity:'完全休息',         duration:'—',     desc:'放松身心，保证睡眠' },
    ],
    light: [
      { day:'周一', activity:'全身力量 (自重)',  duration:'30 min', desc:'俯卧撑/深蹲/臀桥/平板 各3组' },
      { day:'周二', activity:'有氧运动',         duration:'30 min', desc:'跑步或跳绳，保持心率' },
      { day:'周三', activity:'拉伸放松',         duration:'20 min', desc:'瑜伽或全身拉伸' },
      { day:'周四', activity:'全身力量 (自重)',  duration:'30 min', desc:'可加入弹力带增加难度' },
      { day:'周五', activity:'有氧运动',         duration:'30 min', desc:'游泳或骑行' },
      { day:'周六', activity:'户外运动',         duration:'45 min', desc:'羽毛球、篮球或远足' },
      { day:'周日', activity:'休息',             duration:'—',     desc:'让身体充分恢复' },
    ],
    moderate: [
      { day:'周一', activity:'上半身力量',       duration:'35 min', desc:'俯卧撑变式/哑铃推举/划船/臂屈伸' },
      { day:'周二', activity:'有氧运动',         duration:'30 min', desc:'跑步或跳绳，间歇节奏' },
      { day:'周三', activity:'下半身力量',       duration:'35 min', desc:'深蹲/弓步/臀桥/提踵 各3-4组' },
      { day:'周四', activity:'HIIT',             duration:'20 min', desc:'30s冲刺 + 30s休息，重复8-10轮' },
      { day:'周五', activity:'全身力量',         duration:'40 min', desc:'复合动作：深蹲+推举，硬拉+划船' },
      { day:'周六', activity:'球类或有氧',       duration:'45 min', desc:'选择喜欢的运动方式' },
      { day:'周日', activity:'拉伸或瑜伽',       duration:'30 min', desc:'主动恢复，促进血液循环' },
    ],
    active: [
      { day:'周一', activity:'推类训练',         duration:'45 min', desc:'胸/肩/三头 — 卧推、推举、臂屈伸' },
      { day:'周二', activity:'有氧 + 核心',       duration:'40 min', desc:'变速跑 25min + 腹肌训练 15min' },
      { day:'周三', activity:'拉类训练',         duration:'45 min', desc:'背/二头 — 引体、划船、弯举' },
      { day:'周四', activity:'HIIT 或间歇跑',    duration:'25 min', desc:'高强度间歇，全力冲刺' },
      { day:'周五', activity:'腿部训练',         duration:'45 min', desc:'深蹲/硬拉/腿举/腿弯举' },
      { day:'周六', activity:'有氧耐力',         duration:'40 min', desc:'长跑或游泳，维持中等强度' },
      { day:'周日', activity:'主动恢复',         duration:'30 min', desc:'瑜伽、泡沫轴、轻度拉伸' },
    ],
    extreme: [
      { day:'周一', activity:'推类 + 有氧',       duration:'60 min', desc:'大重量推类 + 20min 有氧' },
      { day:'周二', activity:'拉类 + 核心',       duration:'60 min', desc:'大重量拉类 + 核心稳定性训练' },
      { day:'周三', activity:'腿部力量',          duration:'60 min', desc:'深蹲/硬拉 + 辅助训练' },
      { day:'周四', activity:'HIIT',              duration:'25 min', desc:'Tabata 或全力间歇' },
      { day:'周五', activity:'上半身（泵感）',    duration:'45 min', desc:'中等重量高次数，注重肌肉感受' },
      { day:'周六', activity:'有氧耐力',          duration:'50 min', desc:'长距离跑步或骑行' },
      { day:'周日', activity:'主动恢复',          duration:'30 min', desc:'深层拉伸 + 泡沫轴放松' },
    ],
  }

  return plans[activityLevel] || plans.sedentary
}

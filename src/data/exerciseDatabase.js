/**
 * 运动数据库 — MET (Metabolic Equivalent of Task) 标准值
 * 热量计算公式：消耗(kcal) = MET × 体重(kg) × 时长(h)
 */

const EXERCISES = [
  // ═══ 有氧运动 ═══
  { id:'walking',        name:'散步 (3km/h)',     cat:'有氧', met:2.5,  icon:'🚶' },
  { id:'brisk_walk',     name:'快走 (6km/h)',     cat:'有氧', met:5.0,  icon:'🏃' },
  { id:'jogging',        name:'慢跑 (8km/h)',     cat:'有氧', met:8.0,  icon:'🏃' },
  { id:'running',        name:'跑步 (10km/h)',    cat:'有氧', met:10.0, icon:'🏃' },
  { id:'jump_rope',      name:'跳绳',             cat:'有氧', met:11.0, icon:'🪢' },
  { id:'cycling',        name:'骑行 (中速)',      cat:'有氧', met:7.0,  icon:'🚴' },
  { id:'cycling_leisure',name:'骑行 (休闲)',      cat:'有氧', met:4.0,  icon:'🚴' },
  { id:'swimming',       name:'游泳 (自由泳)',    cat:'有氧', met:8.0,  icon:'🏊' },
  { id:'elliptical',     name:'椭圆机',           cat:'有氧', met:5.0,  icon:'🔄' },
  { id:'stair_climb',    name:'爬楼梯',           cat:'有氧', met:8.0,  icon:'🪜' },
  { id:'hiit',           name:'HIIT 高强度间歇',  cat:'有氧', met:10.0, icon:'⚡' },
  { id:'rowing',         name:'划船机',           cat:'有氧', met:7.0,  icon:'🚣' },

  // ═══ 力量训练 ═══
  { id:'strength_light',   name:'力量训练 (轻量/自重)', cat:'力量', met:3.0, icon:'🏋️' },
  { id:'strength_moderate',name:'力量训练 (中等重量)',  cat:'力量', met:5.0, icon:'🏋️' },
  { id:'strength_heavy',   name:'力量训练 (大重量)',    cat:'力量', met:6.0, icon:'🏋️' },
  { id:'bodyweight',       name:'自重训练 (俯卧撑/深蹲/平板)', cat:'力量', met:3.5, icon:'🤸' },

  // ═══ 柔韧/身心 ═══
  { id:'yoga',          name:'瑜伽',             cat:'柔韧', met:3.0, icon:'🧘' },
  { id:'pilates',       name:'普拉提',           cat:'柔韧', met:3.0, icon:'🧘' },
  { id:'stretching',    name:'拉伸放松',         cat:'柔韧', met:2.3, icon:'🙆' },

  // ═══ 球类/户外 ═══
  { id:'badminton',     name:'羽毛球',           cat:'球类', met:5.5, icon:'🏸' },
  { id:'basketball',    name:'篮球',             cat:'球类', met:6.5, icon:'🏀' },
  { id:'table_tennis',  name:'乒乓球',           cat:'球类', met:4.0, icon:'🏓' },
  { id:'soccer',        name:'足球',             cat:'球类', met:7.0, icon:'⚽' },
  { id:'tennis',        name:'网球',             cat:'球类', met:7.3, icon:'🎾' },
]

export default EXERCISES
export const EXERCISE_CATEGORIES = ['全部', '有氧', '力量', '柔韧', '球类']

/** 计算运动消耗热量 */
export function calcExerciseKcal(met, weightKg, durationMin) {
  return Math.round(met * weightKg * (durationMin / 60))
}

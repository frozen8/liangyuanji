const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 投喂消耗的番茄数
const TOMATO_COST = 1
// 饱食度提升量
const SATIETY_GAIN = 20
// 心情提升量
const MOOD_GAIN = 10

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    let { coupleId } = event

    // 兼容 coupleId 参数，未传则从 users 查
    if (!coupleId) {
      const { data: users } = await db.collection('users').where({ _openid: openid }).get()
      if (users.length === 0) return { code: -1, message: '用户不存在', data: null }
      coupleId = users[0].coupleId
    }
    if (!coupleId) return { code: -1, message: '未绑定情侣', data: null }

    const { data: beasts } = await db.collection('beasts').where({ coupleId }).get()
    if (beasts.length === 0) return { code: -1, message: '灵兽不存在', data: null }

    const beast = beasts[0]
    const tomatoCount = beast.tomatoCount || 0
    if (tomatoCount < TOMATO_COST) {
      return { code: -1, message: `番茄不足，需要 ${TOMATO_COST} 个`, data: null }
    }

    const oldStats = beast.stats || {}
    const oldSatiety = oldStats.satiety || 0
    const oldMood = oldStats.mood || 0
    const newSatiety = Math.min(100, oldSatiety + SATIETY_GAIN)
    const newMood = Math.min(100, oldMood + MOOD_GAIN)

    await db.collection('beasts').doc(beast._id).update({
      data: {
        tomatoCount: _.inc(-TOMATO_COST),
        stats: {
          satiety: newSatiety,
          mood: newMood,
          spirit: oldStats.spirit || 0,
          affinity: oldStats.affinity || 0
        }
      }
    })

    const beastResult = {
      ...beast,
      id: beast._id,
      tomatoCount: tomatoCount - TOMATO_COST,
      stats: { ...oldStats, satiety: newSatiety, mood: newMood }
    }

    console.info('[feedBeast] success:', coupleId, 'satiety:', oldSatiety, '->', newSatiety, 'mood:', oldMood, '->', newMood, 'tomato:', tomatoCount, '->', tomatoCount - TOMATO_COST)
    return {
      code: 0,
      message: 'success',
      data: {
        beast: beastResult,
        consumed: { tomato: TOMATO_COST },
        gained: { satiety: newSatiety - oldSatiety, mood: newMood - oldMood }
      }
    }
  } catch (err) {
    console.error('[feedBeast] error:', err)
    return { code: -1, message: err.message || '投喂失败', data: null }
  }
}

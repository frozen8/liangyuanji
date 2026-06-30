const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 境界阈值表（与前端 REALM_LIST 保持一致）
const REALM_THRESHOLDS = [
  { level: 'mortal', min: 0, max: 500 },
  { level: 'qiRefining', min: 500, max: 2000 },
  { level: 'foundation', min: 2000, max: 5000 },
  { level: 'goldenCore', min: 5000, max: 12000 },
  { level: 'nascentSoul', min: 12000, max: 25000 },
  { level: 'spiritSevering', min: 25000, max: 999999 }
]

// 境界 → 灵兽形态映射
const REALM_TO_STAGE = {
  mortal: 'egg',
  qiRefining: 'baby',
  foundation: 'baby',
  goldenCore: 'adult',
  nascentSoul: 'adult',
  spiritSevering: 'divine',
  ascension: 'divine'
}

function calcRealm(cultivation) {
  for (const r of REALM_THRESHOLDS) {
    if (cultivation >= r.min && cultivation < r.max) return r.level
  }
  return 'spiritSevering'
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { sessionId, isEarlyEnd, actualDuration } = event

    if (!sessionId) return { code: -1, message: '缺少修炼会话 ID', data: null }

    console.info('[finishCultivate] 开始处理, sessionId:', sessionId, 'isEarlyEnd:', !!isEarlyEnd)

    const sessionRes = await db.collection('cultivate_sessions').doc(sessionId).get()
    const session = sessionRes.data
    if (!session) return { code: -1, message: '修炼记录不存在', data: null }

    const fullDuration = session.duration || 0
    // 提前终止：按实际时长计算，修为减半；正常完成：按预设时长计算
    const effectiveDuration = isEarlyEnd ? (actualDuration || 0) : fullDuration
    const baseCultivation = effectiveDuration * 10
    const cultivation = isEarlyEnd ? Math.floor(baseCultivation / 2) : baseCultivation
    // 番茄：无论正常还是提前终止都 +1
    const tomatoGain = 1

    await db.collection('cultivate_sessions').doc(sessionId).update({
      data: {
        endAt: db.serverDate(),
        status: 'completed',
        isEarlyEnd: !!isEarlyEnd,
        actualDuration: effectiveDuration,
        reward: { cultivation, tomato: tomatoGain }
      }
    })

    // 更新灵兽修为 + 番茄 + 境界突破 + 宠物进化
    const beastsRes = await db.collection('beasts').where({ coupleId: session.coupleId }).get()
    console.info('[finishCultivate] beasts count:', beastsRes.data.length)

    let beastResult = null
    let breakthrough = null

    if (beastsRes.data.length > 0) {
      const beast = beastsRes.data[0]
      const oldCultivation = beast.cultivation || 0
      const newCultivation = oldCultivation + cultivation
      const oldRealm = beast.realm || 'mortal'
      const newRealm = calcRealm(newCultivation)
      const oldStage = beast.stage || 'egg'
      const newStage = REALM_TO_STAGE[newRealm] || 'egg'
      const oldTomato = beast.tomatoCount || 0

      console.info('[finishCultivate] cultivation:', oldCultivation, '->', newCultivation, 'realm:', oldRealm, '->', newRealm, 'stage:', oldStage, '->', newStage, 'tomato:', oldTomato, '->', oldTomato + tomatoGain)

      const updateData = {
        cultivation: _.inc(cultivation),
        tomatoCount: _.inc(tomatoGain)
      }

      if (newRealm !== oldRealm) {
        updateData.realm = newRealm
        breakthrough = { type: 'realm', from: oldRealm, to: newRealm }
      }
      if (newStage !== oldStage) {
        updateData.stage = newStage
        updateData.evolveTime = db.serverDate()
        breakthrough = breakthrough
          ? { ...breakthrough, type: 'both', fromStage: oldStage, toStage: newStage }
          : { type: 'stage', from: oldStage, to: newStage }
      }

      await db.collection('beasts').doc(beast._id).update({ data: updateData })

      beastResult = {
        ...beast,
        id: beast._id,
        cultivation: newCultivation,
        realm: newRealm,
        stage: newStage,
        tomatoCount: oldTomato + tomatoGain
      }

      if (breakthrough) {
        console.info('[finishCultivate] breakthrough:', JSON.stringify(breakthrough))
      }
    } else {
      console.warn('[finishCultivate] 未找到 coupleId:', session.coupleId, '对应的灵兽')
    }

    console.info('[finishCultivate] success:', sessionId, 'cultivation:', cultivation, 'tomato:', tomatoGain, 'isEarlyEnd:', !!isEarlyEnd)
    return {
      code: 0,
      message: 'success',
      data: {
        reward: { cultivation, tomato: tomatoGain },
        beast: beastResult,
        breakthrough,
        isEarlyEnd: !!isEarlyEnd
      }
    }
  } catch (err) {
    console.error('[finishCultivate] error:', err)
    return { code: -1, message: err.message || '完成失败', data: null }
  }
}

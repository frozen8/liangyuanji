const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { weddingDate, nickname, totalBudget, stoneRate } = event

    if (!totalBudget || totalBudget <= 0) {
      return { code: -1, message: '请填写有效的婚礼总预算', data: null }
    }
    if (!stoneRate || stoneRate <= 0) {
      return { code: -1, message: '请填写有效的灵石换算比例', data: null }
    }

    const inviteCode = 'LY' + Math.random().toString(36).slice(2, 8).toUpperCase()
    const coupleRes = await db.collection('couples').add({
      data: {
        inviteCode,
        members: [openid],
        weddingDate: weddingDate || '2026-10-01',
        stoneRate,
        createTime: db.serverDate()
      }
    })
    const coupleId = coupleRes._id

    const userUpdateRes = await db.collection('users').where({ _openid: openid }).update({
      data: { coupleId, nickname: nickname || '良人' }
    })
    console.info('[createCouple] users 更新结果:', JSON.stringify(userUpdateRes))

    // 如果 update 匹配 0 条，尝试创建 user 文档（兜底）
    if (userUpdateRes.stats.updated === 0) {
      console.warn('[createCouple] users 未匹配到文档，尝试创建')
      await db.collection('users').add({
        data: { _openid: openid, openid, nickname: nickname || '良人', avatar: '', coupleId, createTime: db.serverDate() }
      })
    }

    const beastRes = await db.collection('beasts').add({
      data: {
        coupleId,
        name: '缘缘',
        stage: 'egg',
        level: 1,
        cultivation: 0,
        realm: 'mortal',
        stats: { satiety: 60, mood: 60, spirit: 60, affinity: 50 },
        evolveTime: db.serverDate()
      }
    })

    // 初始化 budgets 文档（v1.1：stoneRate 创建后不可修改）
    await db.collection('budgets').add({
      data: {
        coupleId,
        totalBudget,
        stoneRate,
        categoryBudget: { dress: 0, hotel: 0, catering: 0, gift: 0, decoration: 0, other: 0 },
        updateTime: db.serverDate()
      }
    })

    console.info('[createCouple] success:', coupleId)
    return {
      code: 0,
      message: 'success',
      data: {
        coupleId,
        inviteCode,
        beast: { id: beastRes._id, name: '缘缘', stage: 'egg' },
        budget: { totalBudget, stoneRate }
      }
    }
  } catch (err) {
    console.error('[createCouple] error:', err)
    return { code: -1, message: err.message || '创建失败', data: null }
  }
}
